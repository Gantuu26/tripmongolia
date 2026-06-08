import React from 'react';
import { useTranslation } from 'react-i18next';
import { SEO } from '../components/seo/SEO';
import { HeroSection } from '../components/home/HeroSection';
import { TravelThemeSection } from '../components/home/TravelThemeSection';
import { PromoBanner } from '../components/home/PromoBanner';
import { ReviewSection } from '../components/home/ReviewSection';
import { CategoryRowSection } from '../components/home/CategoryRowSection';
import { MagazineSection } from '../components/home/MagazineSection';
import { useHomeData } from '../hooks/useHomeData';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { TravelThemeSkeleton } from '../components/skeletons/TravelThemeSkeleton';
import { AdventureSkeleton } from '../components/skeletons/AdventureSkeleton';
import { HeroSectionDesktop } from '../components/home-desktop/HeroSection.desktop';
import { QuickLinksRowDesktop } from '../components/home-desktop/QuickLinksRow.desktop';
import { ThemeTabsBarDesktop } from '../components/home-desktop/ThemeTabsBar.desktop';
import { CategorySectionDesktop } from '../components/home-desktop/CategorySection.desktop';
import { MagazineSectionDesktop } from '../components/home-desktop/MagazineSection.desktop';
import { ReviewSectionDesktop } from '../components/home-desktop/ReviewSection.desktop';

export const Home: React.FC = () => {
    const { data, isLoading } = useHomeData();
    const { t } = useTranslation();
    const isDesktop = useIsDesktop();

    const seo = (
        <SEO
            title={t('home.seo_title')}
            description={t('home.seo_description')}
            keywords={t('home.seo_keywords')}
            canonical="/"
            structuredData={[
                {
                    "@context": "https://schema.org",
                    "@type": "TravelAgency",
                    "@id": "https://mongolryokou.com/#organization",
                    "name": "Milkyway Japan",
                    "alternateName": "밀키웨이 재팬",
                    "image": "https://mongolryokou.com/og-image.jpg",
                    "url": "https://mongolryokou.com",
                    "email": "info@mongolryokou.com",
                    "address": {
                        "@type": "PostalAddress",
                        "addressCountry": "MN",
                        "addressLocality": "Ulaanbaatar"
                    },
                    "description": t('home.seo_description'),
                    "priceRange": "$$",
                    "areaServed": "JP",
                    "knowsLanguage": ["ja", "mn"],
                    "sameAs": []
                },
                {
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "@id": "https://mongolryokou.com/#website",
                    "url": "https://mongolryokou.com",
                    "name": "Milkyway Japan | 몽골여행 전문",
                    "publisher": { "@id": "https://mongolryokou.com/#organization" },
                    "inLanguage": "ja",
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": {
                            "@type": "EntryPoint",
                            "urlTemplate": "https://mongolryokou.com/products?q={search_term_string}"
                        },
                        "query-input": "required name=search_term_string"
                    }
                }
            ]}
        />
    );

    // ====== DESKTOP RENDER ======
    if (isDesktop) {
        return (
            <>
                {seo}
                <HeroSectionDesktop />
                <QuickLinksRowDesktop />
                {data.categories.length > 0 && <ThemeTabsBarDesktop categories={data.categories} />}

                {/* SEO H1 — visible to crawlers, visually offscreen */}
                <section className="sr-only">
                    <h1>몽골투어・몽골여행 전문 현지 여행사</h1>
                    <p>
                        Milkyway Japan은 한국어 가이드 동행으로 안심할 수 있는 몽골투어를 안내해 드립니다. 승마여행, 고비사막, 테렐지 국립공원 등 다채로운 플랜을 준비하고 있습니다.
                    </p>
                </section>

                {!isLoading && data.categories.slice(0, 2).map((category) => (
                    <CategorySectionDesktop
                        key={category.id}
                        category={category}
                        products={data.products}
                    />
                ))}

                {!isLoading && data.categories.slice(2).map((category) => (
                    <CategorySectionDesktop
                        key={category.id}
                        category={category}
                        products={data.products}
                    />
                ))}

                <MagazineSectionDesktop magazines={data.magazines} />
                <ReviewSectionDesktop />
                <div style={{ height: 96 }} />
            </>
        );
    }

    // ====== MOBILE RENDER (unchanged) ======
    return (
        <>
            {seo}
            <div style={{ contentVisibility: 'auto', containIntrinsicSize: '400px' }}>
                <HeroSection />
            </div>

            {/* SEO: H1 + Intro (Visually hidden but available for crawlers and screen readers) */}
            <section className="sr-only">
                <h1>몽골투어・몽골여행 전문 현지 여행사</h1>
                <p>
                    Milkyway Japan은 한국어 가이드 동행으로 안심할 수 있는 몽골투어를 안내해 드립니다. 승마여행, 고비사막, 테렐지 국립공원 등 다채로운 플랜을 준비하고 있습니다.
                </p>
            </section>

            {isLoading ? (
                <>
                    <TravelThemeSkeleton />
                    <AdventureSkeleton />
                </>
            ) : (
                <>
                    <div style={{ contentVisibility: 'auto', containIntrinsicSize: '600px' }}>
                        <TravelThemeSection products={data.products} tabs={data.tabs} />
                    </div>
                    <PromoBanner />
                    <div className="flex flex-col gap-2" style={{ contentVisibility: 'auto', containIntrinsicSize: '800px' }}>
                        {data.categories?.map(category => (
                            <CategoryRowSection
                                key={category.id}
                                category={category}
                                products={data.products}
                            />
                        ))}
                    </div>
                    <div style={{ contentVisibility: 'auto', containIntrinsicSize: '600px' }}>
                        <MagazineSection magazines={data.magazines} />
                    </div>
                </>
            )}

            <ReviewSection />
        </>
    );
};
