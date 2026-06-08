import React from 'react';
import { SEO } from '../components/seo/SEO';
import { BottomNav } from '../components/layout/BottomNav';
import { getOptimizedImageUrl } from '../utils/cloudflareImage';

// Single marketing image containing the full company introduction layout.
// Save file to: public/assets/about/detail.jpg
const DETAIL_IMAGE = '/assets/about/detail.jpg';

export const About: React.FC = () => {
    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: '회사 소개 | Milkyway Japan',
            url: 'https://mongolryokou.com/about',
            inLanguage: 'ko',
            mainEntity: {
                '@type': 'TravelAgency',
                name: '몽골리아 은하수',
                alternateName: ['Milkyway Japan', '몽골리아 은하수'],
                url: 'https://mongolryokou.com',
                logo: 'https://mongolryokou.com/favicon.png',
                founder: [
                    { '@type': 'Person', name: 'Bilguun', jobTitle: '대표' },
                    { '@type': 'Person', name: 'Gantuu', jobTitle: '부대표' },
                ],
                employee: [
                    { '@type': 'Person', name: 'Bolor', jobTitle: '여행 디자이너' },
                ],
                areaServed: { '@type': 'Country', name: '몽골' },
                address: {
                    '@type': 'PostalAddress',
                    streetAddress: '바양주르흐구 13동 DACO센터 3층 306호',
                    addressLocality: '울란바토르',
                    addressCountry: 'MN',
                },
            },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: '홈', item: 'https://mongolryokou.com/' },
                { '@type': 'ListItem', position: 2, name: '회사 소개', item: 'https://mongolryokou.com/about' },
            ],
        },
    ];

    return (
        <>
            <SEO
                title="회사 소개"
                description="몽골 현지 여행사 '몽골리아 은하수'. 한국에서 호텔경영학과를 졸업하고 몽골에 거주하는 대표와 부대표가 설립한 가족 경영 몽골여행 회사입니다. 현지인만의 시각과 한국인 여행객의 정서에 맞춘 일정으로, 합리적인 가격에 어디에도 없는 여행을 선사합니다."
                canonical="/about"
                image={DETAIL_IMAGE}
                structuredData={structuredData}
            />

            <main className="bg-background-light dark:bg-background-dark min-h-screen pb-24 break-keep">
                {/* SEO-friendly content mirroring the image (visually hidden, accessible to crawlers & screen readers). */}
                <div className="sr-only">
                    <h1>몽골 현지 여행사 '몽골리아 은하수'</h1>

                    <h2>#여행 이념은?</h2>
                    <p>단순한 관광이 아니라, 몽골의 대자연과 온몸으로 소통하는 특별한 경험을 선사합니다.</p>
                    <p>지친 일상에서 벗어나 몽골의 자연 속에서 새로운 자아를 발견하실 수 있도록 도와드립니다.</p>
                    <p>
                        현지인만이 아는 가장 몽골다운 여행지와 여행 패키지, 그리고 한국인 여행객의 정서에 맞춘 여행 일정으로 어디에도 없는 구성의 여행을 제공하고 있습니다.
                    </p>

                    <h2>#여행의 가치관은?</h2>
                    <p>여행자의 안전과 편의를 최우선으로 생각하며, 여행자의 최상의 만족을 위해 최선을 다해 노력합니다.</p>

                    <h2>팀</h2>
                    <ul>
                        <li>Bilguun - 대표</li>
                        <li>Gantuu - 부대표</li>
                        <li>Bolor - 여행 디자이너</li>
                    </ul>

                    <h2>1. 몽골여행 패키지는 몽골인이 계획해야 합니다.</h2>
                    <p>
                        저희 여행사는 한국에서 호텔경영학과를 졸업하고 몽골에 거주하는 대표와 부대표로 구성된 가족이 설립한 몽골여행 회사입니다. 현지인만이 아는 가장 몽골다운 여행지와 한국인 여행객의 정서에 맞춘 여행 일정으로 어디에도 없는 구성의 여행을 계획합니다.
                    </p>

                    <h2>2. 합리적인 가격이 가장 중요합니다.</h2>
                    <p>
                        현지인만이 운영하는 여행사이기에 대형 여행사의 중간 유통 과정을 생략하여 여행자의 불필요한 수수료 부담을 낮췄습니다. 여행은 오롯이 여행일 뿐, NO 쇼핑, NO 옵션으로 여행 중에 추가로 발생하는 옵션 비용이 없습니다.
                    </p>

                    <h2>3. 몽골여행에 대한 고정관념을 깨뜨립니다.</h2>
                    <p>
                        유목민과 승마, 전통 가옥 게르, 이 모든 것을 체험하면서 호캉스까지 모두 가능합니다. 전통 게르 체험과 깨끗하고 퀄리티 있는 숙박 시설, 쾌적한 차량, 그리고 깔끔하고 맛있는 맛집을 중심으로 여행하게 됩니다.
                    </p>
                </div>

                {/* Visual: the full-length company intro design */}
                <img
                    src={getOptimizedImageUrl(DETAIL_IMAGE, 'productDetailFull')}
                    alt="몽골 현지 여행사 '몽골리아 은하수'의 회사 소개"
                    fetchPriority="high"
                    decoding="async"
                    className="block w-full h-auto mx-auto max-w-2xl"
                />

                {/* CTA */}
                <section className="py-12 sm:py-16 px-6 max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 text-slate-900 dark:text-white">
                        함께 몽골로 떠나지 않으시겠어요?
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6">
                        편하게 문의해 주세요.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <a
                            href="/products"
                            className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-full shadow transition-colors"
                        >
                            투어 상품 보기
                        </a>
                        <a
                            href="/custom-estimate"
                            className="px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-teal-600 dark:text-teal-400 border border-teal-500 font-bold rounded-full shadow transition-colors"
                        >
                            맞춤 여행 상담
                        </a>
                    </div>
                </section>
            </main>

            <BottomNav />
        </>
    );
};
