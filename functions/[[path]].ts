import { drizzle } from 'drizzle-orm/d1';
import { products } from '../src/db/schema/products';

import { eq } from 'drizzle-orm';
import { SEO_CONSTANTS } from '../src/constants/seo';

interface Env {
    DB: D1Database;
}

// Helper to construct absolute image URLs
const getAbsoluteImageUrl = (url: string) => {
    if (!url) return `${SEO_CONSTANTS.SITE_URL}${SEO_CONSTANTS.OG_IMAGE}`;
    if (url.startsWith('http')) return url;
    return `${SEO_CONSTANTS.SITE_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

// 301 redirects from legacy hand-coded SEO pages.
// Targets must exist (verify before adding). For `/category/...` targets the admin-managed
// category row must have a matching id; use the slug editor in the admin panel if not.
const LEGACY_REDIRECTS: Record<string, string> = {
    '/gobi-desert': '/category/gobi-desert',
    '/horse-riding-tour': '/category/horse-riding-tour',
    '/mongol-travel': '/travel-guide',
    '/mongol-tour': '/products',
};

// Per-page SEO configurations for static routes
const STATIC_PAGE_META: Record<string, { title: string; description: string }> = {
    '/products': {
        title: '몽골투어 상품 목록 | Trip Mongolia',
        description: '몽골 승마여행, 고비사막 투어, 테렐지 국립공원, 홉스굴 호수 등 지역·테마별 몽골투어를 한눈에. 한국어 가이드 동행으로 안심하고 떠나세요.'
    },
    '/travel-guide': {
        title: '몽골 여행 가이드 | Trip Mongolia',
        description: '몽골의 대자연, 유목 문화, 추천 명소, 준비물 등 몽골 여행 전에 알아두면 좋은 정보를 한곳에 정리했습니다.'
    },
    '/faq': {
        title: '자주 묻는 질문(FAQ) | Trip Mongolia',
        description: '몽골 여행 관련 자주 묻는 질문과 답변. 예약 방법, 투어 내용, 준비물, 비자, 결제·취소 등 몽골투어 궁금증을 풀어 드립니다.'
    },
    '/reviews': {
        title: '고객 몽골 여행 후기 | Trip Mongolia',
        description: '몽골투어에 참여하신 고객들의 생생한 여행 후기. 실제 경험담으로 투어 선택에 참고하세요.'
    },
    '/custom-estimate': {
        title: '맞춤 견적 문의 | Trip Mongolia',
        description: '고객 요청에 맞춘 몽골투어 맞춤 플랜을 제안해 드립니다. 일정·예산·목적지를 자유롭게 구성하세요.'
    },
    '/travel-mates': {
        title: '동행자 모집 | Trip Mongolia',
        description: '몽골 여행 동행자를 모집·검색하세요. 혼자 여행이 부담되는 분도 여행 메이트를 찾아 함께 몽골투어를 즐기실 수 있습니다.'
    },
    '/about': {
        title: '회사 소개 – 몽골 현지 여행사 | Trip Mongolia',
        description: '몽골 현지 여행사 Trip Mongolia. 한국어가 능통한 현지 전문 가이드가 동행하여, 한국 여행객에 맞춘 일정과 합리적인 가격으로 어디에도 없는 몽골 여행을 제안해 드립니다.'
    }
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
    const url = new URL(context.request.url);
    const path = url.pathname;

    // Legacy Redirects
    if (path.startsWith('/shop_view') || url.searchParams.has('idx')) {
        return Response.redirect(`${SEO_CONSTANTS.SITE_URL}/products`, 301);
    }
    if (LEGACY_REDIRECTS[path]) {
        return Response.redirect(`${SEO_CONSTANTS.SITE_URL}${LEGACY_REDIRECTS[path]}`, 301);
    }

    // 1. Get the original response from the asset (usually index.html for unknown routes in an SPA)
    const response = await context.next();

    // Only process responses that are HTML. We don't want to rewrite assets, images, API JSON, etc.
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
        return response;
    }


    let pageTitle = SEO_CONSTANTS.TITLE;
    let pageDescription = SEO_CONSTANTS.DESCRIPTION;
    let pageImage = getAbsoluteImageUrl(SEO_CONSTANTS.OG_IMAGE);
    const pageUrl = url.href;
    const canonicalUrl = `${SEO_CONSTANTS.SITE_URL}${path === '/' ? '/' : path.replace(/\/$/, '')}`;

    // Server-rendered JSON-LD blocks. These are appended inside <head> so that crawlers
    // that do NOT execute JavaScript (LINE, Kakao, Facebook, some Rich Results previewers)
    // can still see structured data. React's react-helmet still injects its own blocks
    // client-side — schema.org allows multiple valid JSON-LD scripts on one page.
    const extraJsonLd: string[] = [];

    // Check static routes first
    const normalizedPath = path.replace(/\/$/, '') || '/';
    if (STATIC_PAGE_META[normalizedPath]) {
        pageTitle = STATIC_PAGE_META[normalizedPath].title;
        pageDescription = STATIC_PAGE_META[normalizedPath].description;
    }

    try {
        const db = drizzle(context.env.DB);

        // --- Logic for Products ---
        const productMatch = path.match(/^\/products\/([^/]+)$/);
        if (productMatch) {
            const productId = productMatch[1];
            const productArr = await db.select().from(products).where(eq(products.id, productId)).limit(1);
            if (productArr.length > 0) {
                const product = productArr[0];
                pageTitle = `${product.name} | Trip Mongolia`;
                pageDescription = product.description || SEO_CONSTANTS.DESCRIPTION;

                // Parse images if stored as stringified JSON
                let images: string[] = [];
                try {
                    images = typeof product.mainImages === 'string' ? JSON.parse(product.mainImages) : (product.mainImages || []);
                } catch (e) { }
                const absoluteImages = (Array.isArray(images) ? images : [])
                    .filter((img: string) => img && !img.startsWith('data:'))
                    .map((img: string) => getAbsoluteImageUrl(img));

                if (absoluteImages.length > 0) {
                    pageImage = absoluteImages[0];
                }

                // Build Product + BreadcrumbList JSON-LD on the server so crawlers that
                // don't run JS still see structured data (LINE, Kakao, FB, some previewers).
                const priceValidUntil = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                    .toISOString().split('T')[0];

                const productLd: any = {
                    '@context': 'https://schema.org/',
                    '@type': ['Product', 'TouristTrip'],
                    name: product.name,
                    image: absoluteImages.length > 0 ? absoluteImages : undefined,
                    description: product.description || SEO_CONSTANTS.DESCRIPTION,
                    brand: { '@type': 'Brand', name: 'Trip Mongolia' },
                    category: product.category || '몽골투어',
                    touristType: product.category || '몽골투어',
                    ...(product.duration ? {
                        additionalProperty: [
                            { '@type': 'PropertyValue', name: '소요시간', value: product.duration }
                        ]
                    } : {}),
                    offers: {
                        '@type': 'Offer',
                        url: pageUrl,
                        priceCurrency: 'KRW',
                        price: product.price,
                        priceValidUntil: priceValidUntil,
                        itemCondition: 'https://schema.org/NewCondition',
                        availability: product.status === 'active'
                            ? 'https://schema.org/InStock'
                            : 'https://schema.org/OutOfStock',
                        seller: { '@type': 'Organization', name: 'Trip Mongolia' },
                        // Tour bookings are digital — no shipping is required. Declaring a
                        // free, zero-delay shipping policy satisfies Google's Merchant Listing
                        // requirement and avoids the "shippingDetails missing" warning.
                        shippingDetails: {
                            '@type': 'OfferShippingDetails',
                            shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'KRW' },
                            shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'KR' },
                            deliveryTime: {
                                '@type': 'ShippingDeliveryTime',
                                handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 0, unitCode: 'DAY' },
                                transitTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 0, unitCode: 'DAY' },
                            },
                        },
                        // 14-day cancellation window is a reasonable baseline for tour bookings;
                        // satisfies Google's requirement and signals a trustworthy refund policy.
                        hasMerchantReturnPolicy: {
                            '@type': 'MerchantReturnPolicy',
                            applicableCountry: 'KR',
                            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
                            merchantReturnDays: 14,
                            returnMethod: 'https://schema.org/ReturnByMail',
                            returnFees: 'https://schema.org/FreeReturn',
                        },
                    },
                };
                extraJsonLd.push(JSON.stringify(productLd));

                const breadcrumbLd = {
                    '@context': 'https://schema.org',
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: '홈', item: `${SEO_CONSTANTS.SITE_URL}/` },
                        { '@type': 'ListItem', position: 2, name: '몽골투어 상품', item: `${SEO_CONSTANTS.SITE_URL}/products` },
                        { '@type': 'ListItem', position: 3, name: product.name, item: canonicalUrl },
                    ],
                };
                extraJsonLd.push(JSON.stringify(breadcrumbLd));
            }
        }
        // --- Logic for Travel Guides (Magazines) ---
        else {
            const guideMatch = path.match(/^\/travel-guide\/([^/]+)$/);
            if (guideMatch) {
                const guideId = guideMatch[1];
                try {
                    // Fetch magazine using raw D1 prepare as Drizzle schema limits import
                    const guide = await context.env.DB.prepare("SELECT * FROM magazines WHERE id = ?").bind(guideId).first();
                    if (guide) {
                        pageTitle = `${guide.title} | Trip Mongolia 여행 가이드`;
                        pageDescription = (guide.subtitle || guide.description || SEO_CONSTANTS.DESCRIPTION) as string;

                        const imageStr = (guide.thumbnail || guide.image) as string;
                        const absoluteGuideImage = imageStr ? getAbsoluteImageUrl(imageStr) : pageImage;
                        if (imageStr) {
                            pageImage = absoluteGuideImage;
                        }

                        const articleLd = {
                            '@context': 'https://schema.org',
                            '@type': 'BlogPosting',
                            headline: guide.title,
                            description: pageDescription,
                            image: [absoluteGuideImage],
                            datePublished: guide.created_at,
                            dateModified: guide.updated_at || guide.created_at,
                            author: {
                                '@type': guide.author ? 'Person' : 'Organization',
                                name: guide.author || 'Trip Mongolia',
                            },
                            publisher: {
                                '@type': 'Organization',
                                name: 'Trip Mongolia',
                                logo: {
                                    '@type': 'ImageObject',
                                    url: `${SEO_CONSTANTS.SITE_URL}/favicon.png`,
                                },
                            },
                            mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
                            articleSection: guide.category || undefined,
                            inLanguage: 'ko',
                        };
                        extraJsonLd.push(JSON.stringify(articleLd));

                        const breadcrumbLd = {
                            '@context': 'https://schema.org',
                            '@type': 'BreadcrumbList',
                            itemListElement: [
                                { '@type': 'ListItem', position: 1, name: '홈', item: `${SEO_CONSTANTS.SITE_URL}/` },
                                { '@type': 'ListItem', position: 2, name: '여행 가이드', item: `${SEO_CONSTANTS.SITE_URL}/travel-guide` },
                                { '@type': 'ListItem', position: 3, name: guide.title, item: canonicalUrl },
                            ],
                        };
                        extraJsonLd.push(JSON.stringify(breadcrumbLd));
                    }
                } catch (e) {
                    console.log("Guide meta fetch skipped/failed:", e);
                }
            }
        }

    } catch (error) {
        console.error("Meta injection DB error:", error);
        // On error, we just fallback to default meta tags (do not block the user response)
    }

    // 2. Use HTMLRewriter to update existing tags in-place.
    //    Crawlers (LINE, Facebook, Twitter) read the FIRST occurrence,
    //    so we must replace — not append — the tags already in index.html.
    const escape = (s: string) => s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return new HTMLRewriter()
        .on('title', {
            element(el) { el.setInnerContent(pageTitle); }
        })
        .on('meta[name="description"]', {
            element(el) { el.setAttribute('content', pageDescription); }
        })
        .on('link[rel="canonical"]', {
            element(el) { el.setAttribute('href', canonicalUrl); }
        })
        // Open Graph — replace existing tags in index.html
        .on('meta[property="og:title"]', {
            element(el) { el.setAttribute('content', escape(pageTitle)); }
        })
        .on('meta[property="og:description"]', {
            element(el) { el.setAttribute('content', escape(pageDescription)); }
        })
        .on('meta[property="og:image"]', {
            element(el) { el.setAttribute('content', pageImage); }
        })
        .on('meta[property="og:url"]', {
            element(el) { el.setAttribute('content', pageUrl); }
        })
        // Twitter Card — replace existing tags
        .on('meta[name="twitter:title"]', {
            element(el) { el.setAttribute('content', escape(pageTitle)); }
        })
        .on('meta[name="twitter:description"]', {
            element(el) { el.setAttribute('content', escape(pageDescription)); }
        })
        .on('meta[name="twitter:image"]', {
            element(el) { el.setAttribute('content', pageImage); }
        })
        // Append server-rendered JSON-LD blocks inside <head> so crawlers without JS see them.
        // Escape `</script>` inside payloads (JSON.stringify leaves forward slashes raw).
        .on('head', {
            element(el) {
                for (const ld of extraJsonLd) {
                    const safe = ld.replace(/<\/script>/gi, '<\\/script>');
                    el.append(`<script type="application/ld+json">${safe}</script>`, { html: true });
                }
            }
        })
        .transform(response);
};

