import React, { useState, useMemo, useEffect } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Icon } from '../components/admin/console/Icon';
import { api } from '../lib/api';
import { uploadImage } from '../utils/upload';
import { optimizeImage } from '../utils/imageOptimizer';
import { getOptimizedImageUrl } from '../utils/cloudflareImage';
import type { TourProduct, TourPricingOption, AccommodationOption, VehicleOption, DetailSlide, DetailContentBlock, DividerContent, TimelineContent, DayInfoContent } from '../types/product';
import type { Category } from '../types/category';
import type { Hotel } from '../types/hotel';
import type { TouristSpot } from '../types/touristSpot';
import { HotelPickerModal } from '../components/admin/HotelPickerModal';
import { TouristSpotPickerModal } from '../components/admin/TouristSpotPickerModal';



export const AdminProductManage: React.FC = () => {
    const [products, setProducts] = useState<TourProduct[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<TourProduct | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [featuredFilter, setFeaturedFilter] = useState<string>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Load from API
    const fetchProducts = async () => {
        try {
            const data = await api.products.list();
            if (Array.isArray(data)) {
                const parse = (v: any, fallback: any = []) => {
                    if (typeof v === 'string') try { return JSON.parse(v); } catch { return fallback; }
                    return v || fallback;
                };
                const mappedProducts: TourProduct[] = data.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    originalPrice: item.original_price || item.originalPrice,
                    duration: item.duration,
                    category: item.category,
                    mainImages: parse(item.main_images || item.mainImages),
                    isPopular: item.is_popular || item.isPopular,
                    tags: parse(item.tags),
                    description: item.description,
                    galleryImages: parse(item.gallery_images || item.galleryImages),
                    detailImages: parse(item.detail_images || item.detailImages),
                    itineraryImages: parse(item.itinerary_images || item.itineraryImages),
                    detailSlides: parse(item.detail_slides || item.detailSlides),
                    detailBlocks: parse(item.detail_blocks || item.detailBlocks),
                    itineraryBlocks: parse(item.itinerary_blocks || item.itineraryBlocks),
                    status: item.status,
                    isFeatured: item.is_featured || item.isFeatured,
                    highlights: parse(item.highlights),
                    included: parse(item.included),
                    excluded: parse(item.excluded),
                    faqs: parse(item.faqs),
                    viewCount: item.view_count || item.viewCount,
                    bookingCount: item.booking_count || item.bookingCount,
                    pricingOptions: parse(item.pricing_options || item.pricingOptions),
                    accommodationOptions: parse(item.accommodation_options || item.accommodationOptions),
                    vehicleOptions: parse(item.vehicle_options || item.vehicleOptions),
                    createdAt: item.created_at || item.createdAt,
                    updatedAt: item.updated_at || item.updatedAt
                }));
                setProducts(mappedProducts);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await api.categories.list('product');
            if (Array.isArray(data)) {
                setCategories(data.map((c: any) => ({
                    id: c.id,
                    icon: c.icon,
                    name: c.name,
                    description: c.description,
                    isActive: c.is_active ?? true,
                    order: c.sort_order ?? 0,
                    type: c.type || 'product'
                })));
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    // Save via API (Upsert)
    const saveProducts = async (updatedProducts: TourProduct[], productToSave?: TourProduct): Promise<boolean> => {
        if (!productToSave) return false;
        try {
            console.log('Sending payload to API:', productToSave);
            const dbPayload = {
                id: productToSave.id,
                name: productToSave.name,
                price: productToSave.price,
                original_price: productToSave.originalPrice,
                duration: productToSave.duration,
                category: productToSave.category,
                main_images: productToSave.mainImages,
                is_popular: productToSave.isPopular,
                tags: productToSave.tags,
                description: productToSave.description,
                gallery_images: productToSave.galleryImages,
                detail_images: productToSave.detailImages,
                itinerary_images: productToSave.itineraryImages,
                detail_slides: productToSave.detailSlides,
                detail_blocks: productToSave.detailBlocks,
                itinerary_blocks: productToSave.itineraryBlocks,
                status: productToSave.status,
                is_featured: productToSave.isFeatured,
                highlights: productToSave.highlights,
                included: productToSave.included,
                excluded: productToSave.excluded,
                faqs: productToSave.faqs,
                pricing_options: productToSave.pricingOptions,
                accommodation_options: productToSave.accommodationOptions,
                vehicle_options: productToSave.vehicleOptions,
            };

            // If ID matches an existing one in our list, it's an update. Otherwise, it's a create.
            const isEditing = products.some(p => p.id === productToSave.id);
            console.log('Is editing?', isEditing);

            try {
                if (isEditing) {
                    await api.products.update(productToSave.id, dbPayload);
                } else {
                    await api.products.create(dbPayload);
                }
            } catch (apiError: any) {
                console.error('API call failed:', apiError);
                throw apiError; // Throw up so the outer catch can alert it
            }

            console.log('Save successful, fetching latest products...');
            await fetchProducts();
            return true;
        } catch (error: any) {
            console.error('Failed to save product:', error);
            alert('Бүтээгдэхүүн хадгалах үед алдаа гарлаа: ' + (error.message || JSON.stringify(error)));
            return false;
        }
    };

    // Filtered and sorted products
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
            const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
            const matchesFeatured = featuredFilter === 'all' ||
                (featuredFilter === 'featured' && product.isFeatured) ||
                (featuredFilter === 'normal' && !product.isFeatured);

            return matchesSearch && matchesCategory && matchesStatus && matchesFeatured;
        });
    }, [products, searchQuery, categoryFilter, statusFilter, featuredFilter]);

    // Pagination logic... (same)
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Stats
    const stats = useMemo(() => ({
        total: products.length,
        active: products.filter(p => p.status === 'active').length,
        inactive: products.filter(p => p.status === 'inactive').length,
        soldout: products.filter(p => p.status === 'soldout').length,
        featured: products.filter(p => p.isFeatured).length
    }), [products]);

    // Toggle status
    const toggleStatus = async (id: string) => {
        const product = products.find(p => p.id === id);
        if (!product) return;
        const newStatus = product.status === 'active' ? 'inactive' : 'active';
        try {
            await api.products.update(id, { status: newStatus });
            setProducts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
        } catch (e) { console.error(e); }
    };

    // Toggle featured
    const toggleFeatured = async (id: string) => {
        const product = products.find(p => p.id === id);
        if (!product) return;
        const newVal = !product.isFeatured;
        try {
            await api.products.update(id, { is_featured: newVal });
            setProducts(prev => prev.map(p => p.id === id ? { ...p, isFeatured: newVal } : p));
        } catch (e) { console.error(e); }
    };

    // Toggle popular
    const togglePopular = async (id: string) => {
        const product = products.find(p => p.id === id);
        if (!product) return;
        const newVal = !product.isPopular;
        try {
            await api.products.update(id, { is_popular: newVal });
            setProducts(prev => prev.map(p => p.id === id ? { ...p, isPopular: newVal } : p));
        } catch (e) { console.error(e); }
    };

    const deleteProduct = async (id: string) => {
        if (confirm('Та энэ бүтээгдэхүүнийг устгахдаа итгэлтэй байна уу?')) {
            try {
                await api.products.delete(id);
                setProducts(prev => prev.filter(p => p.id !== id));
            } catch (error: any) {
                alert('Устгахад алдаа гарлаа: ' + error.message);
            }
        }
    };

    const duplicateProduct = async (product: TourProduct) => {
        if (confirm(`'${product.name}' бүтээгдэхүүнийг хуулбарлах уу?`)) {
            const duplicatedProduct: TourProduct = {
                ...product,
                id: `prod-${Date.now()}`,
                name: `${product.name} (복제본)`,
                status: 'inactive',
                isFeatured: false,
                isPopular: false,
                viewCount: 0,
                bookingCount: 0
            };
            
            await saveProducts([], duplicatedProduct);
        }
    };

    // Drag and Drop for Products List
    const [draggedProductIndex, setDraggedProductIndex] = useState<number | null>(null);

    const handleProductDragStart = (e: React.DragEvent, index: number) => {
        setDraggedProductIndex(index);
        // Required for Firefox
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleProductDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (draggedProductIndex === null || draggedProductIndex === index) return;
        
        // When filtering or pagination is active, reordering might be tricky.
        // For simplicity, we'll only allow reordering if we are showing all items or searching.
        // And we'll apply it to the main `products` array.
        const draggedProduct = paginatedProducts[draggedProductIndex];
        const targetProduct = paginatedProducts[index];

        // Find their actual indices in the main `products` array
        const actualDragIndex = products.findIndex(p => p.id === draggedProduct.id);
        const actualTargetIndex = products.findIndex(p => p.id === targetProduct.id);

        if (actualDragIndex === -1 || actualTargetIndex === -1) return;

        const newProducts = [...products];
        // Remove from old position
        newProducts.splice(actualDragIndex, 1);
        // Insert at new position
        newProducts.splice(actualTargetIndex, 0, draggedProduct);
        
        setProducts(newProducts);
        setDraggedProductIndex(index);
    };

    const handleProductDragEnd = async () => {
        setDraggedProductIndex(null);
        
        try {
            // Update the sort_order in the backend based on the current products array order
            const orderData = products.map((p, index) => ({
                id: p.id,
                sortOrder: index
            }));
            
            await api.products.reorder(orderData);
            // Optionally show a toast for successful save
        } catch (error) {
            console.error('Failed to save product order:', error);
            alert('Эрэмбэ хадгалахад алдаа гарлаа.');
        }
    };

    const getStatusBadge = (status: string) => {
        const tones = {
            active: 'b-green',
            inactive: 'b-gray',
            soldout: 'b-red'
        };
        const labels = {
            active: 'Зарагдаж байгаа',
            inactive: 'Идэвхгүй',
            soldout: 'Дууссан'
        };
        return (
            <span className={`badge ${tones[status as keyof typeof tones]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    const STAT_CARDS = [
        { key: 'total', label: 'Нийт бүтээгдэхүүн', value: stats.total, ico: 'inventory_2', tint: 'tint-blue' },
        { key: 'active', label: 'Зарагдаж байгаа', value: stats.active, ico: 'check_circle', tint: 'tint-green' },
        { key: 'inactive', label: 'Идэвхгүй', value: stats.inactive, ico: 'cancel', tint: 'tint-ink' },
        { key: 'soldout', label: 'Дууссан', value: stats.soldout, ico: 'remove_shopping_cart', tint: 'tint-red' },
        { key: 'featured', label: 'Онцолсон бүтээгдэхүүн', value: stats.featured, ico: 'star', tint: 'tint-amber' },
    ];

    return (
        <AdminLayout
            activePage="products"
            title="Бүтээгдэхүүний удирдлага"
            actions={
                <button
                    className="btn btn-ink"
                    onClick={() => {
                        setSelectedProduct(null);
                        setIsModalOpen(true);
                    }}
                >
                    <Icon name="add" />Бүтээгдэхүүн нэмэх
                </button>
            }
        >
            <div className="route-anim">
                {/* Statistics Cards */}
                <div className="prod-stats">
                    {STAT_CARDS.map((s) => (
                        <div className="metric" key={s.key} style={{ padding: '16px 18px' }}>
                            <div className="row" style={{ gap: 12 }}>
                                <span className={`metric-ico ${s.tint}`} style={{ width: 40, height: 40 }}>
                                    <Icon name={s.ico} fill />
                                </span>
                                <div>
                                    <div className="metric-label">{s.label}</div>
                                    <div className="metric-value" style={{ fontSize: 22 }}>{s.value}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters / Toolbar */}
                <div className="toolbar" style={{ marginTop: 18 }}>
                    <label className="tb-search">
                        <Icon name="search" />
                        <input
                            type="text"
                            placeholder="Бүтээгдэхүүний нэрээр хайх"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </label>
                    <select
                        className="select"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">Бүх ангилал</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                    <select
                        className="select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Бүх төлөв</option>
                        <option value="active">Зарагдаж байгаа</option>
                        <option value="inactive">Идэвхгүй</option>
                        <option value="soldout">Дууссан</option>
                    </select>
                    <select
                        className="select"
                        value={featuredFilter}
                        onChange={(e) => setFeaturedFilter(e.target.value)}
                    >
                        <option value="all">Онцлох бүгд</option>
                        <option value="featured">Онцолсон бүтээгдэхүүн</option>
                        <option value="normal">Энгийн бүтээгдэхүүн</option>
                    </select>
                </div>

                {/* Products Table */}
                <div className="card">
                    <div className="tbl-wrap">
                        <table className="tbl">
                            <thead>
                                <tr>
                                    <th>Бүтээгдэхүүн</th>
                                    <th>Ангилал</th>
                                    <th>Хугацаа</th>
                                    <th className="r">Үнэ</th>
                                    <th>Төлөв</th>
                                    <th className="c">Онцлох</th>
                                    <th className="c">Эрэлттэй</th>
                                    <th className="c">Үзсэн/Захиалга</th>
                                    <th className="r">Үйлдэл</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedProducts.map((product, index) => (
                                    <tr
                                        key={product.id}
                                        draggable
                                        onDragStart={(e) => handleProductDragStart(e, index)}
                                        onDragOver={(e) => handleProductDragOver(e, index)}
                                        onDrop={handleProductDragEnd}
                                        onDragEnd={handleProductDragEnd}
                                        style={draggedProductIndex === index ? { opacity: 0.5, cursor: 'move' } : { cursor: 'move' }}
                                    >
                                        <td style={{ maxWidth: 340 }}>
                                            <div className="av-cell">
                                                <Icon name="drag_indicator" className="drag-handle" style={{ fontSize: 18 }} />
                                                <span className="thumb sq" style={{ overflow: 'hidden' }}>
                                                    <img
                                                        src={getOptimizedImageUrl(product.mainImages[0], 'productThumbnail')}
                                                        alt={product.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </span>
                                                <div style={{ minWidth: 0 }}>
                                                    <div className="cell-strong" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                                                    <div className="cell-muted" style={{ fontSize: 11.5 }}>{product.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="cell-muted">{product.category}</td>
                                        <td className="cell-muted">{product.duration}</td>
                                        <td className="r">
                                            <div className="cell-price">₩{typeof product.price === 'number' ? product.price.toLocaleString() : (product.price || 0)}</div>
                                            {product.originalPrice ? (
                                                <div className="cell-muted" style={{ fontSize: 11.5, textDecoration: 'line-through' }}>₩{typeof product.originalPrice === 'number' ? product.originalPrice.toLocaleString() : (product.originalPrice || 0)}</div>
                                            ) : null}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => toggleStatus(product.id)}
                                                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
                                            >
                                                {getStatusBadge(product.status)}
                                            </button>
                                        </td>
                                        <td className="c">
                                            <button onClick={() => toggleFeatured(product.id)} className="star-btn" title="Онцлох">
                                                <Icon
                                                    name={product.isFeatured ? 'star' : 'star_border'}
                                                    fill={product.isFeatured}
                                                    style={{ color: product.isFeatured ? 'var(--mrt-star)' : 'var(--mrt-gray-300)' }}
                                                />
                                            </button>
                                        </td>
                                        <td className="c">
                                            <button onClick={() => togglePopular(product.id)} className="star-btn" title="Эрэлттэй">
                                                <Icon
                                                    name={product.isPopular ? 'favorite' : 'favorite_border'}
                                                    fill={product.isPopular}
                                                    style={{ color: product.isPopular ? '#FF4F8B' : 'var(--mrt-gray-300)' }}
                                                />
                                            </button>
                                        </td>
                                        <td className="c">
                                            <div className="cell-mono" style={{ fontSize: 12.5 }}>{typeof product.viewCount === 'number' ? product.viewCount.toLocaleString() : (product.viewCount || 0)}</div>
                                            <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--mrt-blue-strong)' }}>Захиалга {product.bookingCount || 0}</div>
                                        </td>
                                        <td className="r">
                                            <div className="row-actions">
                                                <button onClick={() => duplicateProduct(product)} className="act-btn" title="Хуулбарлах">
                                                    <Icon name="content_copy" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="act-btn"
                                                    title="Засах"
                                                >
                                                    <Icon name="edit" />
                                                </button>
                                                <button onClick={() => deleteProduct(product.id)} className="act-btn danger" title="Устгах">
                                                    <Icon name="delete" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {paginatedProducts.length === 0 && (
                            <div className="empty">
                                <Icon name="inventory_2" />
                                <p>Нөхцөлд тохирох бүтээгдэхүүн алга.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="card-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)' }}>
                            <p className="cell-muted" style={{ fontSize: 13 }}>
                                Нийт {filteredProducts.length} бүтээгдэхүүнээс {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)} харуулж байна
                            </p>
                            <div className="row" style={{ gap: 6 }}>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="btn btn-ghost btn-sm"
                                >
                                    Өмнөх
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`btn btn-sm ${page === currentPage ? 'btn-ink' : 'btn-ghost'}`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="btn btn-ghost btn-sm"
                                >
                                    Дараах
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <ProductModal
                    product={selectedProduct}
                    categories={categories}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedProduct(null);
                    }}
                    onSave={async (product) => {
                        let success = false;
                        if (selectedProduct) {
                            // Edit existing
                            // We don't need full list update here, just pass the product to save
                            success = await saveProducts([], product);
                        } else {
                            // Add new
                            const newProduct = {
                                ...product,
                                id: `prod-${Date.now()}`, // Or let DB generate UUID if preferred, but existing logic uses text ID
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                viewCount: 0,
                                bookingCount: 0
                            };
                            success = await saveProducts([], newProduct);
                        }

                        if (success) {
                            setIsModalOpen(false);
                            setSelectedProduct(null);
                        }
                    }}
                />
            )}
        </AdminLayout>
    );
};

// Product Modal Component
interface ProductModalProps {
    product: TourProduct | null;
    categories: Category[];
    onClose: () => void;
    onSave: (product: TourProduct) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, categories, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<TourProduct>>(
        product || {
            name: '',
            category: categories.length > 0 ? categories[0].name : '',
            duration: '',
            price: 0,
            originalPrice: 0,
            mainImages: [],
            galleryImages: [],
            detailImages: [],
            detailSlides: [],
            detailBlocks: [],
            itineraryBlocks: [],
            status: 'active',
            isFeatured: false,
            isPopular: false,
            tags: [],
            highlights: [],
            included: [],
            excluded: [],
            faqs: [],
            pricingOptions: [],
            accommodationOptions: [],
            vehicleOptions: []
        }
    );

    const [currentTab, setCurrentTab] = useState<'basic' | 'details' | 'itinerary' | 'options' | 'includes'>('basic');

    // Drag and Drop state
    const [draggedDetailIndex, setDraggedDetailIndex] = useState<number | null>(null);

    // Handlers
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted', formData);

        // Validate required fields
        if (!formData.name || !formData.name.trim()) {
            alert('Бүтээгдэхүүний нэрийг оруулна уу.');
            return;
        }
        if (!formData.duration || !formData.duration.trim()) {
            alert('Хугацааг оруулна уу.');
            return;
        }
        if (!formData.price || formData.price <= 0) {
            alert('Зарах үнийг оруулна уу.');
            return;
        }

        console.log('Calling onSave');
        onSave(formData as TourProduct);
        console.log('onSave called');
    };

    const addHighlight = () => {
        setFormData({
            ...formData,
            highlights: [...(formData.highlights || []), { icon: 'star', title: '', description: '' }]
        });
    };

    const updateHighlight = (index: number, field: string, value: string) => {
        const updated = [...(formData.highlights || [])];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, highlights: updated });
    };

    const removeHighlight = (index: number) => {
        setFormData({
            ...formData,
            highlights: formData.highlights?.filter((_, i) => i !== index)
        });
    };

    // FAQ Handlers — per-product Q&A list. When empty the frontend falls
    // back to the site-wide common FAQs.
    const addFAQ = () => {
        setFormData({
            ...formData,
            faqs: [...(formData.faqs || []), { q: '', a: '' }],
        });
    };
    const updateFAQ = (index: number, field: 'q' | 'a', value: string) => {
        const updated = [...(formData.faqs || [])];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, faqs: updated });
    };
    const removeFAQ = (index: number) => {
        setFormData({
            ...formData,
            faqs: formData.faqs?.filter((_, i) => i !== index),
        });
    };

    // Pricing Option Handlers
    const addPricingOption = () => {
        setFormData({
            ...formData,
            pricingOptions: [...(formData.pricingOptions || []), { people: 2, pricePerPerson: 0, depositPerPerson: 0, localPaymentPerPerson: 0 }]
        });
    };
    const updatePricingOption = (index: number, field: keyof TourPricingOption, value: number) => {
        const updated = [...(formData.pricingOptions || [])];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, pricingOptions: updated });
    };
    const removePricingOption = (index: number) => {
        setFormData({
            ...formData,
            pricingOptions: formData.pricingOptions?.filter((_, i) => i !== index)
        });
    };

    // Accommodation Option Handlers
    const addAccommodationOption = () => {
        setFormData({
            ...formData,
            accommodationOptions: [...(formData.accommodationOptions || []), {
                id: `acc-${Date.now()}`,
                name: '',
                description: '',
                priceModifier: 0,
                isDefault: (formData.accommodationOptions?.length || 0) === 0
            }]
        });
    };
    const updateAccommodationOption = (index: number, field: keyof AccommodationOption, value: any) => {
        const updated = [...(formData.accommodationOptions || [])];
        updated[index] = { ...updated[index], [field]: value };

        // Handle default selection logic (radio behavior)
        if (field === 'isDefault' && value === true) {
            updated.forEach((opt, i) => {
                if (i !== index) opt.isDefault = false;
            });
        }

        setFormData({ ...formData, accommodationOptions: updated });
    };
    const removeAccommodationOption = (index: number) => {
        setFormData({
            ...formData,
            accommodationOptions: formData.accommodationOptions?.filter((_, i) => i !== index)
        });
    };

    // Vehicle Option Handlers
    const addVehicleOption = () => {
        setFormData({
            ...formData,
            vehicleOptions: [...(formData.vehicleOptions || []), {
                id: `veh-${Date.now()}`,
                name: '',
                description: '',
                priceModifier: 0,
                isDefault: (formData.vehicleOptions?.length || 0) === 0
            }]
        });
    };
    const updateVehicleOption = (index: number, field: keyof VehicleOption, value: any) => {
        const updated = [...(formData.vehicleOptions || [])];
        updated[index] = { ...updated[index], [field]: value };

        // Handle default selection logic
        if (field === 'isDefault' && value === true) {
            updated.forEach((opt, i) => {
                if (i !== index) opt.isDefault = false;
            });
        }

        setFormData({ ...formData, vehicleOptions: updated });
    };
    const removeVehicleOption = (index: number) => {
        setFormData({
            ...formData,
            vehicleOptions: formData.vehicleOptions?.filter((_, i) => i !== index)
        });
    };

    // Detail Block Handlers
    const addDetailBlock = (type: 'image' | 'slide' | 'divider' | 'timeline' | 'dayInfo', dayLabel?: string) => {
        let content: any = '';

        if (type === 'slide') {
            content = {
                id: `slide-${Date.now()}`,
                type: 'day',
                dayLabel: '',
                title: '',
                description: '',
                images: []
            };
        } else if (type === 'divider') {
            content = {
                style: 'space',
                height: 40
            };
        } else if (type === 'timeline') {
            content = {
                id: `timeline-${Date.now()}`,
                time: '',
                title: '',
                description: '',
                images: []
            };
        } else if (type === 'dayInfo') {
            content = {
                id: `dayinfo-${Date.now()}`,
                dayLabel: dayLabel || '',
                dayDate: '',
                title: '',
                description: '',
                meals: { breakfast: '', lunch: '', dinner: '' },
                accommodation: ''
            };
        }

        const newBlock: DetailContentBlock = {
            id: `block-${Date.now()}-${Math.random()}`,
            type,
            content
        };
        setFormData({
            ...formData,
            detailBlocks: [...(formData.detailBlocks || []), newBlock]
        });
    };

    const removeDetailBlock = (index: number) => {
        setFormData({
            ...formData,
            detailBlocks: formData.detailBlocks?.filter((_, i) => i !== index)
        });
    };

    const moveDetailBlock = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= (formData.detailBlocks?.length || 0)) return;
        const blocks = [...(formData.detailBlocks || [])];
        const [moved] = blocks.splice(fromIndex, 1);
        blocks.splice(toIndex, 0, moved);
        setFormData({ ...formData, detailBlocks: blocks });
    };

    const updateBlockContent = (index: number, content: any) => {
        const blocks = [...(formData.detailBlocks || [])];
        blocks[index] = { ...blocks[index], content };
        setFormData({ ...formData, detailBlocks: blocks });
    };

    const updateSlideInBlock = (blockIndex: number, field: string, value: any) => {
        const blocks = [...(formData.detailBlocks || [])];
        const block = blocks[blockIndex];
        if (block.type !== 'slide') return;
        const slide = block.content as DetailSlide;
        const updatedSlide = { ...slide, [field]: value };
        blocks[blockIndex] = { ...block, content: updatedSlide };
        setFormData({ ...formData, detailBlocks: blocks });
    };

    const handleBlockImageUpload = async (index: number, file: File) => {
        try {
            const url = await uploadImage(file, 'product-details'); // Upload to Storage
            updateBlockContent(index, url);
        } catch (error) {
            console.error('Block image upload failed:', error);
            alert('Зураг байршуулахад алдаа гарлаа');
        }
    };

    const handleSlideBlockImages = async (blockIndex: number, files: FileList | null) => {
        if (!files) return;

        try {
            const uploadPromises = Array.from(files).map(file => uploadImage(file, 'product-slides'));
            const urls = await Promise.all(uploadPromises);

            const block = formData.detailBlocks?.[blockIndex];
            if (block && block.type === 'slide') {
                const currentSlide = block.content as DetailSlide;
                const updatedSlide = {
                    ...currentSlide,
                    images: [...currentSlide.images, ...urls]
                };
                /* Actually let's just manually update here for clarity */
                const blocks = [...(formData.detailBlocks || [])];
                blocks[blockIndex] = { ...block, content: updatedSlide };
                setFormData({ ...formData, detailBlocks: blocks });
            }
        } catch (error) {
            console.error('Slide images upload failed:', error);
            alert('Зураг байршуулахад алдаа гарлаа');
        }
    };

    const removeSlideBlockImage = (blockIndex: number, imgIndex: number) => {
        const blocks = [...(formData.detailBlocks || [])];
        const block = blocks[blockIndex];
        if (block.type !== 'slide') return;
        const slide = block.content as DetailSlide;
        const newSlide = { ...slide, images: slide.images.filter((_, i) => i !== imgIndex) };
        blocks[blockIndex] = { ...block, content: newSlide };
        setFormData({ ...formData, detailBlocks: blocks });
    };


    // ─── Hotel picker — works for both dayInfo (accommodation) and timeline (itinerary item) ─
    // Target type lets the picker know which block to update on selection.
    const [hotelPickerTarget, setHotelPickerTarget] = useState<
        { kind: 'dayInfoAccommodation' | 'timeline'; index: number } | null
    >(null);
    const handleHotelPick = (hotel: Hotel) => {
        if (!hotelPickerTarget) return;
        const { kind, index } = hotelPickerTarget;
        const block = formData.itineraryBlocks?.[index];
        if (!block) {
            setHotelPickerTarget(null);
            return;
        }

        if (kind === 'dayInfoAccommodation' && block.type === 'dayInfo') {
            // Snapshot the full hotel record so the user-facing page can render
            // photo grid + description even if the master row is later edited
            // or deleted.
            updateItineraryBlockContent(index, {
                ...(block.content as DayInfoContent),
                accommodation: hotel.name_kr,
                accommodationHotelId: hotel.id,
                accommodationImages: hotel.images && hotel.images.length > 0 ? [...hotel.images] : [],
                accommodationDescription: hotel.description || '',
                accommodationAddress: hotel.address || '',
                accommodationSubtitle: hotel.name_local || '',
            });
        } else if (kind === 'timeline' && block.type === 'timeline') {
            // For a TIMELINE block: push hotel data into title + description + images.
            // This is the "hotel as a timeline event" flow (e.g., hotel check-in).
            const current = block.content as TimelineContent;
            const hotelDesc = [hotel.description, hotel.address].filter(Boolean).join('\n\n');
            updateItineraryBlockContent(index, {
                ...current,
                title: hotel.name_kr,
                description: hotelDesc || current.description,
                images: hotel.images && hotel.images.length > 0 ? [...hotel.images] : current.images,
            });
        }
        setHotelPickerTarget(null);
    };

    // ─── Tourist spot picker — only opens from TIMELINE blocks ─────────
    const [spotPickerForIndex, setSpotPickerForIndex] = useState<number | null>(null);
    const handleSpotPick = (spot: TouristSpot) => {
        if (spotPickerForIndex == null) return;
        const block = formData.itineraryBlocks?.[spotPickerForIndex];
        if (block && block.type === 'timeline') {
            const current = block.content as TimelineContent;
            const desc = [spot.description, spot.address].filter(Boolean).join('\n\n');
            updateItineraryBlockContent(spotPickerForIndex, {
                ...current,
                title: spot.name_kr,
                description: desc || current.description,
                images: spot.images && spot.images.length > 0 ? [...spot.images] : current.images,
            });
        }
        setSpotPickerForIndex(null);
    };

    // Backwards-compat helper for the existing dayInfo button.
    const setHotelPickerForIndex = (index: number | null) => {
        if (index == null) setHotelPickerTarget(null);
        else setHotelPickerTarget({ kind: 'dayInfoAccommodation', index });
    };

    // ─── Bulk image upload (drag&drop multi-file) ─────────────────────
    // Uploads all files in parallel and appends one image block per file.
    // Lets the admin drop 20 photos at once instead of clicking "Зураг нэмэх"
    // → empty box → file picker for each one.
    const [itineraryBulkUploading, setItineraryBulkUploading] = useState(false);
    const [itineraryBulkProgress, setItineraryBulkProgress] = useState<{ done: number; total: number } | null>(null);
    // Day-based itinerary editor UI state: which day cards are collapsed / showing the advanced menu.
    const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
    const [advancedDays, setAdvancedDays] = useState<Set<string>>(new Set());
    const bulkAddItineraryImages = async (files: File[]) => {
        if (files.length === 0) return;
        setItineraryBulkUploading(true);
        setItineraryBulkProgress({ done: 0, total: files.length });
        try {
            // Upload all files. Track progress as each resolves so admin sees
            // "5/20 байршуулж байна..." instead of just spinning indefinitely.
            let done = 0;
            const urls = await Promise.all(
                files.map((f) =>
                    uploadImage(f, 'product-details').then((url) => {
                        done += 1;
                        setItineraryBulkProgress({ done, total: files.length });
                        return url;
                    })
                )
            );
            const stamp = Date.now();
            const newBlocks: DetailContentBlock[] = urls.map((url, i) => ({
                id: `block-${stamp}-${i}-${Math.random().toString(36).slice(2, 8)}`,
                type: 'image',
                content: url,
            }));
            setFormData((prev) => ({
                ...prev,
                itineraryBlocks: [...(prev.itineraryBlocks || []), ...newBlocks],
            }));
        } catch (e) {
            console.error('Bulk itinerary image upload failed:', e);
            alert('Зураг байршуулах явцад зарим нь амжилтгүй боллоо.');
        } finally {
            setItineraryBulkUploading(false);
            setItineraryBulkProgress(null);
        }
    };

    // ─── N-day skeleton generator ────────────────────────────────────
    // One click → creates N dayInfo blocks (1일차 … N일차) with dividers
    // between them. Admin then just fills in titles / descriptions per day.
    const DAY_LABELS_JP = [
        '1일차', '2일차', '3일차',
        '4일차', '5일차', '6일차',
        '7일차', '8일차', '9일차',
        '10일차',
    ];
    const addDaysSkeleton = (days: number) => {
        if (!Number.isFinite(days) || days < 1) return;
        const capped = Math.min(14, Math.max(1, Math.floor(days)));
        const stamp = Date.now();
        const newBlocks: DetailContentBlock[] = [];
        for (let i = 0; i < capped; i++) {
            newBlocks.push({
                id: `block-${stamp}-d${i}-info`,
                type: 'dayInfo',
                content: {
                    id: `dayinfo-${stamp}-${i}`,
                    dayLabel: DAY_LABELS_JP[i] || `${i + 1}일차`,
                    dayDate: '',
                    title: '',
                    description: '',
                    meals: { breakfast: '', lunch: '', dinner: '' },
                    accommodation: '',
                },
            });
            if (i < capped - 1) {
                newBlocks.push({
                    id: `block-${stamp}-d${i}-divider`,
                    type: 'divider',
                    content: { style: 'space', height: 40 },
                });
            }
        }
        // Prepend day-skeleton blocks before any existing content. This way if
        // the admin already added timeline events without dayInfo, those events
        // fall under the new day 1 (the frontend groups by dayInfo order).
        setFormData((prev) => {
            const existing = prev.itineraryBlocks || [];
            const hasAnyDayInfo = existing.some((b) => b.type === 'dayInfo');
            if (!hasAnyDayInfo) {
                return { ...prev, itineraryBlocks: [...newBlocks, ...existing] };
            }
            return { ...prev, itineraryBlocks: [...existing, ...newBlocks] };
        });
    };

    // Itinerary Block Handlers (same as Detail Block but for itinerary)
    const addItineraryBlock = (type: 'image' | 'slide' | 'divider' | 'timeline' | 'dayInfo', dayLabel?: string) => {
        let content: any = '';

        if (type === 'slide') {
            content = {
                id: `slide-${Date.now()}`,
                type: 'day',
                dayLabel: '',
                title: '',
                description: '',
                images: []
            };
        } else if (type === 'divider') {
            content = {
                style: 'space',
                height: 40
            };
        } else if (type === 'timeline') {
            content = {
                id: `timeline-${Date.now()}`,
                time: '',
                title: '',
                description: '',
                images: []
            };
        } else if (type === 'dayInfo') {
            content = {
                id: `dayinfo-${Date.now()}`,
                dayLabel: dayLabel || '',
                dayDate: '',
                title: '',
                description: '',
                meals: { breakfast: '', lunch: '', dinner: '' },
                accommodation: ''
            };
        }

        const newBlock: DetailContentBlock = {
            id: `block-${Date.now()}-${Math.random()}`,
            type,
            content
        };
        setFormData({
            ...formData,
            itineraryBlocks: [...(formData.itineraryBlocks || []), newBlock]
        });
    };

    /**
     * Adds a TIMELINE block right after the dayInfo at `afterDayIndex`,
     * i.e. at the *end* of that day's events but *before* the next dayInfo.
     * This lets admin add 5~10 events per day without using ↑/↓ arrows.
     */
    const addTimelineAfterDay = (afterDayIndex: number) => {
        const blocks = formData.itineraryBlocks ?? [];
        if (afterDayIndex < 0 || afterDayIndex >= blocks.length) return;
        if (blocks[afterDayIndex].type !== 'dayInfo') return;

        // Find the index of the next dayInfo block (or end of array).
        let insertAt = blocks.length;
        for (let i = afterDayIndex + 1; i < blocks.length; i++) {
            if (blocks[i].type === 'dayInfo') {
                insertAt = i;
                break;
            }
        }

        const newBlock: DetailContentBlock = {
            id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'timeline',
            content: {
                id: `timeline-${Date.now()}`,
                time: '',
                title: '',
                description: '',
                images: [],
            },
        };

        const next = [...blocks];
        next.splice(insertAt, 0, newBlock);
        setFormData({ ...formData, itineraryBlocks: next });

        // Scroll to the newly inserted block after the next paint so the admin
        // sees where it went.
        setTimeout(() => {
            const el = document.querySelector(`[data-itinerary-block="${newBlock.id}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
    };

    // ─────────────────────────────────────────────────────────────────────
    // Day-based itinerary editor (날짜별 카드).
    //
    // The public renderer groups the flat `itineraryBlocks` array by `dayInfo`
    // markers: each dayInfo starts a new day, the blocks after it are that day's
    // events. We keep that exact storage shape but project it into day cards so
    // the admin never has to hand-order a flat block list. All content editing
    // still flows through the existing index-based handlers (updateTimelineInBlock,
    // handleTimelineBlockImages, master pickers, …) — only structural ops are new.
    // ─────────────────────────────────────────────────────────────────────
    type EditorEvent = { block: DetailContentBlock; flatIndex: number };
    type EditorDay = { dayInfo: DetailContentBlock; dayInfoFlatIndex: number; events: EditorEvent[] };
    type PlainDay = { dayInfo: DetailContentBlock; events: DetailContentBlock[] };

    const isSpacerBlock = (b: DetailContentBlock) =>
        b.type === 'divider' && (b.content as DividerContent)?.style === 'space';

    // Read-only projection for the render layer. Cosmetic spacer dividers (auto
    // inserted between days) are hidden from the per-day event lists.
    const groupItineraryForEditor = (blocks: DetailContentBlock[]): { pre: EditorEvent[]; days: EditorDay[] } => {
        const pre: EditorEvent[] = [];
        const days: EditorDay[] = [];
        let cur: EditorDay | null = null;
        blocks.forEach((block, flatIndex) => {
            if (block.type === 'dayInfo') {
                cur = { dayInfo: block, dayInfoFlatIndex: flatIndex, events: [] };
                days.push(cur);
            } else if (isSpacerBlock(block)) {
                // skip — regenerated on serialize
            } else if (cur) {
                cur.events.push({ block, flatIndex });
            } else {
                pre.push({ block, flatIndex });
            }
        });
        return { pre, days };
    };

    // Serialize day groups back to the canonical flat array: renumber day labels
    // sequentially, put exactly one space divider between consecutive days.
    const flattenItineraryDays = (pre: DetailContentBlock[], days: PlainDay[]): DetailContentBlock[] => {
        const out: DetailContentBlock[] = [...pre];
        days.forEach((d, i) => {
            const dc = d.dayInfo.content as DayInfoContent;
            out.push({ ...d.dayInfo, content: { ...dc, dayLabel: dc.dayLabel || DAY_LABELS_JP[i] || `${i + 1}일차` } });
            out.push(...d.events);
            if (i < days.length - 1) {
                out.push({ id: `block-sep-${d.dayInfo.id}`, type: 'divider', content: { style: 'space', height: 40 } });
            }
        });
        return out;
    };

    // Regroup current blocks → let the mutator edit the plain groups → flatten → set.
    const rebuildItinerary = (mutate: (g: { pre: DetailContentBlock[]; days: PlainDay[] }) => void) => {
        setFormData((prev) => {
            const blocks = prev.itineraryBlocks || [];
            const pre: DetailContentBlock[] = [];
            const days: PlainDay[] = [];
            let cur: PlainDay | null = null;
            for (const b of blocks) {
                if (b.type === 'dayInfo') { cur = { dayInfo: b, events: [] }; days.push(cur); }
                else if (isSpacerBlock(b)) { /* drop cosmetic spacer; regenerated on flatten */ }
                else if (cur) { cur.events.push(b); }
                else { pre.push(b); }
            }
            const g = { pre, days };
            mutate(g);
            return { ...prev, itineraryBlocks: flattenItineraryDays(g.pre, g.days) };
        });
    };

    const makeItineraryBlock = (type: 'timeline' | 'image' | 'slide' | 'divider'): DetailContentBlock => {
        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        if (type === 'timeline') return { id: `block-${stamp}`, type, content: { id: `timeline-${stamp}`, time: '', title: '', description: '', images: [] } };
        if (type === 'slide') return { id: `block-${stamp}`, type, content: { id: `slide-${stamp}`, type: 'day', dayLabel: '', title: '', description: '', images: [] } };
        if (type === 'divider') return { id: `block-${stamp}`, type, content: { style: 'line', height: 20 } };
        return { id: `block-${stamp}`, type, content: '' }; // image
    };

    const addItineraryDay = () => {
        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        rebuildItinerary((g) => {
            g.days.push({
                dayInfo: {
                    id: `block-${stamp}-info`,
                    type: 'dayInfo',
                    content: { id: `dayinfo-${stamp}`, dayLabel: '', dayDate: '', title: '', description: '', meals: { breakfast: '', lunch: '', dinner: '' }, accommodation: '' },
                },
                events: [],
            });
        });
    };

    const removeItineraryDay = (dayGroupIndex: number) => {
        rebuildItinerary((g) => { g.days.splice(dayGroupIndex, 1); });
    };

    const moveItineraryDay = (dayGroupIndex: number, dir: -1 | 1) => {
        rebuildItinerary((g) => {
            const t = dayGroupIndex + dir;
            if (t < 0 || t >= g.days.length) return;
            [g.days[dayGroupIndex], g.days[t]] = [g.days[t], g.days[dayGroupIndex]];
        });
    };

    // 한 일차(제목·날짜·식사·숙박·일정 항목 전체)를 통째로 복제해 바로 아래에 추가
    const duplicateItineraryDay = (dayGroupIndex: number) => {
        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        let n = 0;
        const cloneBlock = (b: DetailContentBlock): DetailContentBlock => {
            const content = JSON.parse(JSON.stringify(b.content ?? null));
            if (content && typeof content === 'object' && 'id' in content) content.id = `c-${stamp}-${n}`;
            return { ...b, id: `block-${stamp}-${n++}`, content };
        };
        rebuildItinerary((g) => {
            const src = g.days[dayGroupIndex];
            if (!src) return;
            g.days.splice(dayGroupIndex + 1, 0, {
                dayInfo: cloneBlock(src.dayInfo),
                events: src.events.map(cloneBlock),
            });
        });
    };

    const addItineraryEvent = (dayGroupIndex: number, type: 'timeline' | 'image' | 'slide' | 'divider') => {
        const block = makeItineraryBlock(type);
        rebuildItinerary((g) => { g.days[dayGroupIndex]?.events.push(block); });
        setTimeout(() => {
            const el = document.querySelector(`[data-itinerary-block="${block.id}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
    };

    const removeItineraryEvent = (dayGroupIndex: number, eventIndex: number) => {
        rebuildItinerary((g) => { g.days[dayGroupIndex]?.events.splice(eventIndex, 1); });
    };

    const moveItineraryEvent = (dayGroupIndex: number, eventIndex: number, dir: -1 | 1) => {
        rebuildItinerary((g) => {
            const evs = g.days[dayGroupIndex]?.events;
            if (!evs) return;
            const t = eventIndex + dir;
            if (t < 0 || t >= evs.length) return;
            [evs[eventIndex], evs[t]] = [evs[t], evs[eventIndex]];
        });
    };

    const toggleDayCollapsed = (id: string) => {
        setCollapsedDays((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    };
    const toggleDayAdvanced = (id: string) => {
        setAdvancedDays((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    };

    const removeItineraryBlock = (index: number) => {
        setFormData({
            ...formData,
            itineraryBlocks: formData.itineraryBlocks?.filter((_, i) => i !== index)
        });
    };

    const moveItineraryBlock = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= (formData.itineraryBlocks?.length || 0)) return;
        const blocks = [...(formData.itineraryBlocks || [])];
        const [moved] = blocks.splice(fromIndex, 1);
        blocks.splice(toIndex, 0, moved);
        setFormData({ ...formData, itineraryBlocks: blocks });
    };

    const updateItineraryBlockContent = (index: number, content: any) => {
        const blocks = [...(formData.itineraryBlocks || [])];
        blocks[index] = { ...blocks[index], content };
        setFormData({ ...formData, itineraryBlocks: blocks });
    };

    const updateItinerarySlideInBlock = (blockIndex: number, field: string, value: any) => {
        const blocks = [...(formData.itineraryBlocks || [])];
        const block = blocks[blockIndex];
        if (block.type !== 'slide') return;
        const slide = block.content as DetailSlide;
        const updatedSlide = { ...slide, [field]: value };
        blocks[blockIndex] = { ...block, content: updatedSlide };
        setFormData({ ...formData, itineraryBlocks: blocks });
    };

    const handleItineraryBlockImageUpload = async (index: number, file: File) => {
        try {
            const url = await uploadImage(file, 'product-details');
            updateItineraryBlockContent(index, url);
        } catch (error) {
            console.error('Itinerary block image upload failed:', error);
            alert('Зураг байршуулахад алдаа гарлаа');
        }
    };

    const handleItinerarySlideBlockImages = async (blockIndex: number, files: FileList | null) => {
        if (!files) return;

        try {
            const uploadPromises = Array.from(files).map(file => uploadImage(file, 'product-details'));
            const urls = await Promise.all(uploadPromises);

            const block = formData.itineraryBlocks?.[blockIndex];
            if (block && block.type === 'slide') {
                const currentSlide = block.content as DetailSlide;
                const updatedSlide = {
                    ...currentSlide,
                    images: [...currentSlide.images, ...urls]
                };
                const blocks = [...(formData.itineraryBlocks || [])];
                blocks[blockIndex] = { ...block, content: updatedSlide };
                setFormData({ ...formData, itineraryBlocks: blocks });
            }
        } catch (error) {
            console.error('Itinerary slide images upload failed:', error);
            alert('Зураг байршуулахад алдаа гарлаа');
        }
    };

    const removeItinerarySlideBlockImage = (blockIndex: number, imageIndex: number) => {
        const block = formData.itineraryBlocks?.[blockIndex];
        if (block && block.type === 'slide') {
            const currentSlide = block.content as DetailSlide;
            const updatedSlide = {
                ...currentSlide,
                images: currentSlide.images.filter((_, i) => i !== imageIndex)
            };
            const blocks = [...(formData.itineraryBlocks || [])];
            blocks[blockIndex] = { ...block, content: updatedSlide };
            setFormData({ ...formData, itineraryBlocks: blocks });
        }
    };

    // Generic Timeline Block Handlers
    const updateTimelineInBlock = (blocksArray: 'detail' | 'itinerary', blockIndex: number, field: string, value: any) => {
        const blocks = [...(blocksArray === 'detail' ? (formData.detailBlocks || []) : (formData.itineraryBlocks || []))];
        const block = blocks[blockIndex];
        if (block.type !== 'timeline') return;
        const timeline = block.content as TimelineContent;
        const updatedTimeline = { ...timeline, [field]: value };
        blocks[blockIndex] = { ...block, content: updatedTimeline };
        
        if (blocksArray === 'detail') setFormData({ ...formData, detailBlocks: blocks });
        else setFormData({ ...formData, itineraryBlocks: blocks });
    };
    
    const handleTimelineBlockImages = async (blocksArray: 'detail' | 'itinerary', blockIndex: number, files: FileList | null) => {
        if (!files) return;
        try {
            const uploadPromises = Array.from(files).map(file => uploadImage(file, 'product-details'));
            const urls = await Promise.all(uploadPromises);
            
            const blocks = [...(blocksArray === 'detail' ? (formData.detailBlocks || []) : (formData.itineraryBlocks || []))];
            const block = blocks[blockIndex];
            if (block.type === 'timeline') {
                const currentTimeline = block.content as TimelineContent;
                const updatedTimeline = {
                    ...currentTimeline,
                    images: [...currentTimeline.images, ...urls]
                };
                blocks[blockIndex] = { ...block, content: updatedTimeline };
                if (blocksArray === 'detail') setFormData({ ...formData, detailBlocks: blocks });
                else setFormData({ ...formData, itineraryBlocks: blocks });
            }
        } catch (error) {
            console.error('Timeline images upload failed:', error);
            alert('Зураг байршуулахад алдаа гарлаа');
        }
    };
    
    const removeTimelineBlockImage = (blocksArray: 'detail' | 'itinerary', blockIndex: number, imgIndex: number) => {
        const blocks = [...(blocksArray === 'detail' ? (formData.detailBlocks || []) : (formData.itineraryBlocks || []))];
        const block = blocks[blockIndex];
        if (block.type !== 'timeline') return;
        const timeline = block.content as TimelineContent;
        const newTimeline = { ...timeline, images: timeline.images.filter((_, i) => i !== imgIndex) };
        blocks[blockIndex] = { ...block, content: newTimeline };
        
        if (blocksArray === 'detail') setFormData({ ...formData, detailBlocks: blocks });
        else setFormData({ ...formData, itineraryBlocks: blocks });
    };

    // Detail Image handlers
    const handleDetailImageUpload = async (files: FileList | null) => {
        if (!files) return;

        try {
            const uploadPromises = Array.from(files).map(file => uploadImage(file, 'product-details'));
            const urls = await Promise.all(uploadPromises);

            setFormData(prev => ({
                ...prev,
                detailImages: [...(prev.detailImages || []), ...urls]
            }));
        } catch (error) {
            console.error('Detail image upload failed:', error);
            alert('Зураг байршуулахад алдаа гарлаа');
        }
    };

    const removeDetailImage = (imageIndex: number) => {
        setFormData({
            ...formData,
            detailImages: formData.detailImages?.filter((_, i) => i !== imageIndex)
        });
    };

    // Drag and Drop handlers for Detail Images
    const handleDetailDragStart = (index: number) => {
        setDraggedDetailIndex(index);
    };

    const handleDetailDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedDetailIndex === null || draggedDetailIndex === index) return;

        const images = [...(formData.detailImages || [])];
        const draggedImage = images[draggedDetailIndex];

        // Remove from old position
        images.splice(draggedDetailIndex, 1);
        // Insert at new position
        images.splice(index, 0, draggedImage);

        setFormData({ ...formData, detailImages: images });
        setDraggedDetailIndex(index);
    };

    const handleDetailDragEnd = () => {
        setDraggedDetailIndex(null);
    };

    // Main Image handlers
    const handleMainImageUpload = async (files: FileList | null) => {
        if (!files) return;

        try {
            const uploadPromises = Array.from(files).map(file => uploadImage(file, 'products'));
            const urls = await Promise.all(uploadPromises);

            setFormData(prev => ({
                ...prev,
                mainImages: [...(prev.mainImages || []), ...urls]
            }));
        } catch (error) {
            console.error('Main image upload failed:', error);
            alert('Зураг байршуулахад алдаа гарлаа');
        }
    };

    const removeMainImage = (imageIndex: number) => {
        setFormData({
            ...formData,
            mainImages: formData.mainImages?.filter((_, i) => i !== imageIndex)
        });
    };

    const moveMainImage = (imageIndex: number, direction: 'up' | 'down') => {
        const images = [...(formData.mainImages || [])];
        const newIndex = direction === 'up' ? imageIndex - 1 : imageIndex + 1;

        if (newIndex < 0 || newIndex >= images.length) return;

        [images[imageIndex], images[newIndex]] = [images[newIndex], images[imageIndex]];
        setFormData({ ...formData, mainImages: images });
    };

    const addTag = (tag: string) => {
        if (tag && !formData.tags?.includes(tag)) {
            setFormData({ ...formData, tags: [...(formData.tags || []), tag] });
        }
    };

    const removeTag = (tag: string) => {
        setFormData({ ...formData, tags: formData.tags?.filter(t => t !== tag) });
    };

    const addIncluded = (item: string) => {
        if (item) {
            setFormData({ ...formData, included: [...(formData.included || []), item] });
        }
    };

    const removeIncluded = (index: number) => {
        setFormData({ ...formData, included: formData.included?.filter((_, i) => i !== index) });
    };

    const addExcluded = (item: string) => {
        if (item) {
            setFormData({ ...formData, excluded: [...(formData.excluded || []), item] });
        }
    };

    const removeExcluded = (index: number) => {
        setFormData({ ...formData, excluded: formData.excluded?.filter((_, i) => i !== index) });
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,27,30,0.42)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 80, padding: 16, overflowY: 'auto' }}>
            <div className="card" style={{ width: '100%', maxWidth: 920, margin: '32px 0', boxShadow: 'var(--shadow-lg)' }}>
                {/* Header */}
                <div className="card-head">
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)', margin: 0 }}>
                        {product ? 'Бүтээгдэхүүн засах' : 'Бүтээгдэхүүн нэмэх'}
                    </h2>
                    <div className="spacer" />
                    <button onClick={onClose} className="act-btn" title="Хаах" type="button">
                        <Icon name="close" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="card-pad" style={{ paddingTop: 10, paddingBottom: 0 }}>
                    <div className="tabs" style={{ marginBottom: 0 }}>
                        {[
                            { id: 'basic', label: 'Үндсэн мэдээлэл', icon: 'info' },
                            { id: 'details', label: 'Дэлгэрэнгүй мэдээлэл', icon: 'description' },
                            { id: 'itinerary', label: 'Хөтөлбөр', icon: 'calendar_month' },
                            { id: 'options', label: 'Үнэ/Сонголт', icon: 'attach_money' },
                            { id: 'includes', label: 'Багтсан/Багтаагүй', icon: 'checklist' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setCurrentTab(tab.id as any)}
                                className={`tab${currentTab === tab.id ? ' active' : ''}`}
                            >
                                <Icon name={tab.icon} />{tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="card-pad" style={{ maxHeight: '64vh', overflowY: 'auto' }}>
                        {/* Basic Info Tab */}
                        {currentTab === 'basic' && (
                            <div style={{ maxWidth: 760 }}>
                                <div className="field">
                                    <label>Бүтээгдэхүүний нэр *</label>
                                    <input
                                        type="text"
                                        className="inp"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="field">
                                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span>Бүтээгдэхүүний тайлбар / 概要 <span className="muted" style={{ fontWeight: 500 }}>(PC дэлгэрэнгүй хуудасны 「概要」 + хайлтын үр дүн·хуваалцах урьдчилан харах)</span></span>
                                        <span className="muted" style={{ color: (formData.description?.length || 0) > 160 ? 'var(--mrt-red)' : undefined }}>
                                            {formData.description?.length || 0} / 160
                                        </span>
                                    </label>
                                    <textarea
                                        className="inp"
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        placeholder="예: 쏟아지는 별빛과 노을로 물드는 대초원, 유목민 문화를 체험하는 중앙몽골 3박 4일 투어입니다. 가이드 동행, 전 일정 식사·숙박 포함입니다."
                                    />
                                    <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                                        Google хайлт болон LINE/Kakao-оор хуваалцах үед харагдах богино танилцуулга текст. 100~160 тэмдэгт хамгийн тохиромжтой.
                                    </p>
                                </div>

                                <div className="field-row">
                                    <div className="field">
                                        <label>Ангилал *</label>
                                        <select
                                            className="inp"
                                            style={{ appearance: 'none' }}
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            required
                                        >
                                            <option value="" disabled>Ангилал сонгох</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="field">
                                        <label>Хугацаа *</label>
                                        <input
                                            type="text"
                                            className="inp"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            placeholder="жишээ: 4 хоног 5 өдөр"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="field-row">
                                    <div className="field">
                                        <label>Зарах үнэ *</label>
                                        <input
                                            type="number"
                                            className="inp"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                            required
                                        />
                                    </div>

                                    <div className="field">
                                        <label>Үндсэн үнэ (сонголтоор)</label>
                                        <input
                                            type="number"
                                            className="inp"
                                            value={formData.originalPrice || ''}
                                            onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) || undefined })}
                                        />
                                    </div>
                                </div>

                                {/* Main Images Upload */}
                                <div className="field">
                                    <label>Үндсэн зураг байршуулах *</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => handleMainImageUpload(e.target.files)}
                                        className="inp"
                                        style={{ paddingTop: 10, height: 'auto' }}
                                    />
                                    <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>Хэд хэдэн үндсэн зураг байршуулна уу (слайдаар харагдана)</p>

                                    {/* Main Images Grid */}
                                    {formData.mainImages && formData.mainImages.length > 0 && (
                                        <div className="grid-3" style={{ marginTop: 14 }}>
                                            {formData.mainImages.map((img, imgIndex) => (
                                                <div key={imgIndex} style={{ position: 'relative', border: '1px solid var(--border-default)', borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'var(--mrt-gray-100)' }}>
                                                    <img
                                                        src={getOptimizedImageUrl(img, 'productThumbnail')}
                                                        alt={`Main ${imgIndex + 1}`}
                                                        style={{ width: '100%', height: 128, objectFit: 'cover', pointerEvents: 'none', display: 'block' }}
                                                    />

                                                    {/* Image Controls */}
                                                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                                                        {imgIndex > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => moveMainImage(imgIndex, 'up')}
                                                                className="act-btn"
                                                                title="Дээш зөөх"
                                                            >
                                                                <Icon name="arrow_upward" />
                                                            </button>
                                                        )}
                                                        {imgIndex < (formData.mainImages?.length || 0) - 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => moveMainImage(imgIndex, 'down')}
                                                                className="act-btn"
                                                                title="Доош зөөх"
                                                            >
                                                                <Icon name="arrow_downward" />
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeMainImage(imgIndex)}
                                                            className="act-btn danger"
                                                            title="Устгах"
                                                        >
                                                            <Icon name="delete" />
                                                        </button>
                                                    </div>

                                                    {/* Image Number Badge */}
                                                    <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 6 }}>
                                                        {imgIndex + 1} / {formData.mainImages?.length || 0}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="field-row">
                                    <div className="field">
                                        <label>Төлөв</label>
                                        <select
                                            className="inp"
                                            style={{ appearance: 'none' }}
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        >
                                            <option value="active">Зарагдаж байгаа</option>
                                            <option value="inactive">Идэвхгүй</option>
                                            <option value="soldout">Дууссан</option>
                                        </select>
                                    </div>

                                    <div className="field">
                                        <label>Харагдах тохиргоо</label>
                                        <div className="stack" style={{ gap: 10 }}>
                                            <div className="toggle-row">
                                                <div>
                                                    <div className="cell-strong">Онцолсон бүтээгдэхүүн</div>
                                                    <div className="cell-muted" style={{ fontSize: 12 }}>Нүүр хуудасны онцлох хэсэгт харуулах</div>
                                                </div>
                                                <div className="spacer" style={{ flex: 1 }} />
                                                <button
                                                    type="button"
                                                    className={`switch${formData.isFeatured ? ' on' : ''}`}
                                                    onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                                                >
                                                    <span className="knob" />
                                                </button>
                                            </div>
                                            <div className="toggle-row">
                                                <div>
                                                    <div className="cell-strong">Эрэлттэй бүтээгдэхүүн</div>
                                                    <div className="cell-muted" style={{ fontSize: 12 }}>Эрэлттэй тэмдэг харуулах</div>
                                                </div>
                                                <div className="spacer" style={{ flex: 1 }} />
                                                <button
                                                    type="button"
                                                    className={`switch${formData.isPopular ? ' on' : ''}`}
                                                    onClick={() => setFormData({ ...formData, isPopular: !formData.isPopular })}
                                                >
                                                    <span className="knob" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Details Tab */}
                        {currentTab === 'details' && (
                            <div className="stack" style={{ maxWidth: 860 }}>
                                {/* Tags */}
                                <div className="field" style={{ marginBottom: 0 }}>
                                    <label>Шошго</label>
                                    {formData.tags && formData.tags.length > 0 && (
                                        <div className="chip-row" style={{ marginBottom: 8 }}>
                                            {formData.tags?.map(tag => (
                                                <span key={tag} className="chip active">
                                                    {tag}
                                                    <button type="button" onClick={() => removeTag(tag)} style={{ border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', display: 'inline-flex', padding: 0 }}>
                                                        <Icon name="close" style={{ fontSize: 14 }} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        className="inp"
                                        placeholder="Шошго бичээд Enter дарна уу"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addTag((e.target as HTMLInputElement).value);
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }}
                                    />
                                </div>

                                {/* Highlights form removed per admin request.
                                    addHighlight/updateHighlight/removeHighlight
                                    handlers are kept in case any legacy data
                                    still flows through saves, but no UI exposes
                                    them now. */}

                                {/* FAQ — per-product Q&A. Empty list = use site-wide common FAQs. */}
                                <section className="edit-sec">
                                    <div className="edit-sec-head">
                                        <Icon name="help" />
                                        <h4>FAQ (Түгээмэл асуулт)</h4>
                                        <span className="muted">Хоосон орхивол нийтлэг FAQ харагдана</span>
                                    </div>
                                    <div className="stack" style={{ gap: 10 }}>
                                        {formData.faqs?.map((faq, index) => (
                                            <div className="edit-row" key={index}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                                                        <span className="cell-mono" style={{ fontSize: 12, paddingTop: 12, color: 'var(--mrt-blue-strong)' }}>Q{index + 1}.</span>
                                                        <input
                                                            type="text"
                                                            className="inp"
                                                            style={{ flex: 1 }}
                                                            value={faq.q}
                                                            onChange={(e) => updateFAQ(index, 'q', e.target.value)}
                                                            placeholder="Асуулт"
                                                        />
                                                    </div>
                                                    <textarea
                                                        className="inp"
                                                        style={{ marginTop: 8 }}
                                                        value={faq.a}
                                                        onChange={(e) => updateFAQ(index, 'a', e.target.value)}
                                                        placeholder="Хариулт"
                                                        rows={3}
                                                    />
                                                </div>
                                                <button type="button" className="act-btn danger" onClick={() => removeFAQ(index)} title="Устгах">
                                                    <Icon name="delete" />
                                                </button>
                                            </div>
                                        ))}
                                        {(!formData.faqs || formData.faqs.length === 0) && (
                                            <div className="card-muted-note">
                                                <Icon name="info" />
                                                <span>Q&A нэмэхгүй бол сайтын нийтлэг FAQ ашиглагдана.</span>
                                            </div>
                                        )}
                                        <button type="button" className="add-line" onClick={addFAQ}><Icon name="add" />Q&A нэмэх</button>
                                    </div>
                                </section>

                                {/* Detail Images Section */}
                                <div>
                                    {/* Detail Block Content Section */}
                                    <div>
                                        <div className="block-add-bar">
                                            <span className="block-add-label"><Icon name="add" />Блок нэмэх</span>
                                            <button type="button" className="chip" onClick={() => addDetailBlock('image')}>
                                                <Icon name="image" style={{ fontSize: 16 }} />Зураг
                                            </button>
                                            <button type="button" className="chip" onClick={() => addDetailBlock('slide')}>
                                                <Icon name="view_carousel" style={{ fontSize: 16 }} />Слайд
                                            </button>
                                            <button type="button" className="chip" onClick={() => addDetailBlock('timeline')}>
                                                <Icon name="schedule" style={{ fontSize: 16 }} />Цагийн хуваарь
                                            </button>
                                            <select
                                                onChange={(e) => { if (e.target.value) { addDetailBlock('dayInfo', e.target.value); e.target.value = ''; } }}
                                                defaultValue=""
                                                className="select"
                                                style={{ height: 36, fontSize: 13 }}
                                            >
                                                <option value="" disabled>📅 Өдөр нэмэх</option>
                                                <option value="1일차">1일차</option>
                                                <option value="2일차">2일차</option>
                                                <option value="3일차">3일차</option>
                                                <option value="4일차">4일차</option>
                                                <option value="5일차">5일차</option>
                                                <option value="6일차">6일차</option>
                                                <option value="7일차">7일차</option>
                                                <option value="8일차">8일차</option>
                                                <option value="9일차">9일차</option>
                                                <option value="10일차">10일차</option>
                                            </select>
                                            <button type="button" className="chip" onClick={() => addDetailBlock('divider')}>
                                                <Icon name="horizontal_rule" style={{ fontSize: 16 }} />Зураас/Зай
                                            </button>
                                        </div>
                                        <div className="card-muted-note" style={{ marginBottom: 14 }}>
                                            <Icon name="info" />
                                            <span>Зураг болон слайдыг чөлөөтэй байрлуулж дэлгэрэнгүй хуудсыг бүрдүүлнэ үү. Эрэмбийг өөрчлөх буюу устгах боломжтой.</span>
                                        </div>

                                        <div className="stack" style={{ gap: 12 }}>
                                            {(formData.detailBlocks || []).map((block, index) => (
                                                <div key={block.id} className="edit-row">
                                                    <div className="edit-move">
                                                        <button type="button" onClick={() => moveDetailBlock(index, index - 1)} disabled={index === 0}><Icon name="expand_less" /></button>
                                                        <button type="button" onClick={() => moveDetailBlock(index, index + 1)} disabled={index === (formData.detailBlocks?.length || 0) - 1}><Icon name="expand_more" /></button>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        {/* Block Header */}
                                                        <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                                                            <span className="badge b-gray">
                                                                {block.type === 'image' ? 'SINGLE' : (block.type === 'slide' ? 'SLIDE' : (block.type === 'timeline' ? 'TIMELINE' : (block.type === 'dayInfo' ? 'DAY INFO' : 'DIVIDER')))}
                                                            </span>
                                                            <span className="cell-muted" style={{ fontSize: 12 }}>{index + 1}-р блок</span>
                                                        </div>

                                                        {/* Block Content */}
                                                        {block.type === 'image' ? (
                                                            // IMAGE BLOCK
                                                            <div className="block-img">
                                                                {block.content ? (
                                                                    <div style={{ position: 'relative' }}>
                                                                        <img
                                                                            src={getOptimizedImageUrl(block.content as string, 'productThumbnail')}
                                                                            alt={`Block ${index + 1}`}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateBlockContent(index, '')}
                                                                            className="btn btn-ink btn-sm"
                                                                            style={{ position: 'absolute', top: 8, right: 8 }}
                                                                        >
                                                                            Солих
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <label className="block-img-empty" style={{ cursor: 'pointer' }}>
                                                                        <Icon name="add_photo_alternate" />
                                                                        Зураг байршуулах
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={(e) => {
                                                                                if (e.target.files?.[0]) handleBlockImageUpload(index, e.target.files[0]);
                                                                            }}
                                                                            style={{ display: 'none' }}
                                                                        />
                                                                    </label>
                                                                )}
                                                            </div>
                                                        ) : block.type === 'slide' ? (
                                                            // SLIDE BLOCK
                                                            <div className="stack" style={{ gap: 8 }}>
                                                                <input
                                                                    type="text"
                                                                    className="inp"
                                                                    value={(block.content as DetailSlide).title || ''}
                                                                    onChange={(e) => updateSlideInBlock(index, 'title', e.target.value)}
                                                                    placeholder="Слайдын гарчиг (жишээ: 1-р өдрийн байр)"
                                                                />
                                                                <div>
                                                                    <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Зургийн жагсаалт (олон зураг байршуулах боломжтой)</label>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        multiple
                                                                        onChange={(e) => handleSlideBlockImages(index, e.target.files)}
                                                                        className="inp"
                                                                        style={{ height: 'auto', paddingTop: 8, paddingBottom: 8, fontSize: 13 }}
                                                                    />
                                                                </div>
                                                                {(block.content as DetailSlide).images?.length > 0 && (
                                                                    <div className="row" style={{ gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                                                                        {(block.content as DetailSlide).images.map((img, imgIdx) => (
                                                                            <div key={imgIdx} style={{ position: 'relative', flex: 'none' }}>
                                                                                <img src={getOptimizedImageUrl(img, 'productThumbnail')} alt={`Slide Img ${imgIdx}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--r-md)', border: '1px solid var(--border-default)' }} />
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeSlideBlockImage(index, imgIdx)}
                                                                                    style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'var(--mrt-red)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                                                                                >
                                                                                    <Icon name="close" style={{ fontSize: 14 }} />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : block.type === 'timeline' ? (
                                                            // TIMELINE BLOCK
                                                            <div className="stack" style={{ gap: 8 }}>
                                                                <div className="row" style={{ gap: 8 }}>
                                                                    <input type="text" className="inp" style={{ width: 140 }} value={(block.content as TimelineContent).time || ''} onChange={(e) => updateTimelineInBlock('detail', index, 'time', e.target.value)} placeholder="Цаг (жишээ: 10:00)" />
                                                                    <input type="text" className="inp" style={{ flex: 1, fontWeight: 700 }} value={(block.content as TimelineContent).title || ''} onChange={(e) => updateTimelineInBlock('detail', index, 'title', e.target.value)} placeholder="Гарчиг (жишээ: Зайсан толгой)" />
                                                                </div>
                                                                <textarea className="inp" value={(block.content as TimelineContent).description || ''} onChange={(e) => updateTimelineInBlock('detail', index, 'description', e.target.value)} placeholder="Тайлбар" rows={3} />
                                                                <div>
                                                                    <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Зургийн жагсаалт (олон зураг байршуулах боломжтой)</label>
                                                                    <input type="file" accept="image/*" multiple onChange={(e) => handleTimelineBlockImages('detail', index, e.target.files)} className="inp" style={{ height: 'auto', paddingTop: 8, paddingBottom: 8, fontSize: 13 }} />
                                                                </div>
                                                                {(block.content as TimelineContent).images?.length > 0 && (
                                                                    <div className="row" style={{ gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                                                                        {(block.content as TimelineContent).images.map((img, imgIdx) => (
                                                                            <div key={imgIdx} style={{ position: 'relative', flex: 'none' }}>
                                                                                <img src={getOptimizedImageUrl(img, 'productThumbnail')} alt={`TL Img ${imgIdx}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--r-md)', border: '1px solid var(--border-default)' }} />
                                                                                <button type="button" onClick={() => removeTimelineBlockImage('detail', index, imgIdx)} style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'var(--mrt-red)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon name="close" style={{ fontSize: 14 }} /></button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : block.type === 'dayInfo' ? (
                                                            // DAY INFO BLOCK
                                                            <div className="stack" style={{ gap: 8 }}>
                                                                <div className="field-row">
                                                                    <div>
                                                                        <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Өдөр</label>
                                                                        <div className="badge b-amber" style={{ height: 44, borderRadius: 'var(--r-md)', width: '100%', justifyContent: 'flex-start', padding: '0 14px', fontSize: 14 }}>{(block.content as DayInfoContent).dayLabel || 'Тодорхойгүй'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Огноо (жишээ: 05/26(Мяг))</label>
                                                                        <input type="text" className="inp" value={(block.content as DayInfoContent).dayDate || ''} onChange={(e) => updateBlockContent(index, { ...(block.content as DayInfoContent), dayDate: e.target.value })} placeholder="05/26(Мяг)" />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Хөтөлбөрийн гарчиг</label>
                                                                    <input type="text" className="inp" value={(block.content as DayInfoContent).title || ''} onChange={(e) => updateBlockContent(index, { ...(block.content as DayInfoContent), title: e.target.value })} placeholder="Инчон, Улаанбаатар, Горхи-Тэрэлж" />
                                                                </div>
                                                                <div>
                                                                    <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Гол хөтөлбөрийн товч</label>
                                                                    <input type="text" className="inp" value={(block.content as DayInfoContent).description || ''} onChange={(e) => updateBlockContent(index, { ...(block.content as DayInfoContent), description: e.target.value })} placeholder="Их дэлгүүр, Тэрэлж байгалийн цогцолбор, Мэлхий хад..." />
                                                                </div>
                                                                <div>
                                                                    <label className="cell-strong" style={{ fontSize: 12.5, display: 'block', marginBottom: 6 }}>🍽 Хоолны мэдээлэл</label>
                                                                    <div className="meal-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                                                        <div className="inp-mini"><span className="pre" style={{ fontSize: 11 }}>Өглөө</span><input value={(block.content as DayInfoContent).meals?.breakfast || ''} onChange={(e) => updateBlockContent(index, { ...(block.content as DayInfoContent), meals: { ...(block.content as DayInfoContent).meals, breakfast: e.target.value } })} placeholder="Кэмпийн хоол" /></div>
                                                                        <div className="inp-mini"><span className="pre" style={{ fontSize: 11 }}>Өдөр</span><input value={(block.content as DayInfoContent).meals?.lunch || ''} onChange={(e) => updateBlockContent(index, { ...(block.content as DayInfoContent), meals: { ...(block.content as DayInfoContent).meals, lunch: e.target.value } })} placeholder="Орон нутгийн хоол" /></div>
                                                                        <div className="inp-mini"><span className="pre" style={{ fontSize: 11 }}>Орой</span><input value={(block.content as DayInfoContent).meals?.dinner || ''} onChange={(e) => updateBlockContent(index, { ...(block.content as DayInfoContent), meals: { ...(block.content as DayInfoContent).meals, dinner: e.target.value } })} placeholder="Кэмпийн хоол" /></div>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="cell-strong" style={{ fontSize: 12.5, display: 'block', marginBottom: 6 }}>🏠 Байрны мэдээлэл</label>
                                                                    <div className="inp-mini"><span className="pre"><Icon name="hotel" style={{ fontSize: 14 }} /></span><input value={(block.content as DayInfoContent).accommodation || ''} onChange={(e) => updateBlockContent(index, { ...(block.content as DayInfoContent), accommodation: e.target.value })} placeholder="Тусдаа ариун цэврийн өрөө, шүршүүртэй тансаг гэр" /></div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            // DIVIDER BLOCK
                                                            <div className="row" style={{ gap: 16, alignItems: 'flex-end' }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Загвар</label>
                                                                    <div className="row" style={{ gap: 8 }}>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateBlockContent(index, { ...(block.content as DividerContent), style: 'line' })}
                                                                            className={`btn btn-sm ${(block.content as DividerContent).style === 'line' ? 'btn-ink' : 'btn-ghost'}`}
                                                                            style={{ flex: 1 }}
                                                                        >
                                                                            Хэвтээ зураас
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateBlockContent(index, { ...(block.content as DividerContent), style: 'space' })}
                                                                            className={`btn btn-sm ${(block.content as DividerContent).style === 'space' ? 'btn-ink' : 'btn-ghost'}`}
                                                                            style={{ flex: 1 }}
                                                                        >
                                                                            Зай
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div style={{ width: 140 }}>
                                                                    <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Өндөр ({(block.content as DividerContent).height}px)</label>
                                                                    <input
                                                                        type="range"
                                                                        min="10"
                                                                        max="120"
                                                                        step="10"
                                                                        value={(block.content as DividerContent).height}
                                                                        onChange={(e) => updateBlockContent(index, { ...(block.content as DividerContent), height: parseInt(e.target.value) })}
                                                                        style={{ width: '100%' }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button type="button" className="act-btn danger" onClick={() => removeDetailBlock(index)} title="Устгах"><Icon name="delete" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Itinerary Tab */}
                        {currentTab === 'itinerary' && (
                            <div className="stack" style={{ maxWidth: 860 }}>
                                {/* ─── Quick actions: bulk image upload + N-day skeleton ─── */}
                                <ItineraryQuickActions
                                    onBulkImages={bulkAddItineraryImages}
                                    onSkeleton={addDaysSkeleton}
                                    uploading={itineraryBulkUploading}
                                    progress={itineraryBulkProgress}
                                />

                                {/* Itinerary — day-based editor (날짜별 카드).
                                    Projects the flat itineraryBlocks array into day cards for
                                    editing, then serializes back to the SAME flat shape the public
                                    renderer expects. Public site / DB untouched. */}
                                <div>
                                    <div className="card-muted-note" style={{ marginBottom: 14, display: 'block' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontWeight: 700 }}><Icon name="lightbulb" />Хөтөлбөрийг өдрөөр нь амархан бөглөнө</div>
                                        <ul style={{ margin: '8px 0 0', paddingLeft: 20, listStyle: 'disc', lineHeight: 1.7 }}>
                                            <li>Доорх <strong>「Хоног нэмэх」</strong> товчоор 1, 2, 3... дахь өдрийг нэмнэ. Өдрийн дугаар автоматаар тавигдана.</li>
                                            <li>Өдөр бүрийн карт дотор <strong>гарчиг·огноо·хоол·байр</strong>-ыг бөглөж, <strong>「Хөтөлбөрийн зүйл нэмэх」</strong>-ээр тухайн өдрийн үйл явдлуудыг (цаг·газар·зураг) дараалан нэмнэ.</li>
                                            <li>Аялалын газар / Зочид буудлын <strong>мастераас сонгох</strong> товчоор гарчиг·тайлбар·зураг автоматаар бөглөгдөнө.</li>
                                            <li>Олон зургийг нэг дор оруулах бол дээд талын <strong>зураг чирэх хайрцаг</strong>-ыг ашиглана.</li>
                                        </ul>
                                    </div>

                                    {(() => {
                                        const { pre, days } = groupItineraryForEditor(formData.itineraryBlocks || []);
                                        const typeLabel = (t: string) => (t === 'image' ? 'Зураг' : t === 'slide' ? 'Галерей' : t === 'divider' ? 'Зураас' : 'Хөтөлбөр');

                                        const renderEventBody = (block: DetailContentBlock, flatIndex: number) => {
                                            if (block.type === 'timeline') {
                                                const c = block.content as TimelineContent;
                                                return (
                                                    <div className="stack" style={{ gap: 8 }}>
                                                        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                                                            <button type="button" onClick={() => setSpotPickerForIndex(flatIndex)} className="btn btn-blue btn-sm" title="Аялалын газрын мастераас сонгох"><Icon name="location_on" />Газар сонгох</button>
                                                            <button type="button" onClick={() => setHotelPickerTarget({ kind: 'timeline', index: flatIndex })} className="btn btn-ghost btn-sm" title="Зочид буудлын мастераас сонгох"><Icon name="hotel" />Буудал сонгох</button>
                                                        </div>
                                                        <div className="row" style={{ gap: 8 }}>
                                                            <input type="text" className="inp" style={{ width: 120 }} value={c.time || ''} onChange={(e) => updateTimelineInBlock('itinerary', flatIndex, 'time', e.target.value)} placeholder="Цаг (10:00)" />
                                                            <input type="text" className="inp" style={{ flex: 1, fontWeight: 700 }} value={c.title || ''} onChange={(e) => updateTimelineInBlock('itinerary', flatIndex, 'title', e.target.value)} placeholder="Гарчиг (Зайсан толгой)" />
                                                        </div>
                                                        <textarea className="inp" value={c.description || ''} onChange={(e) => updateTimelineInBlock('itinerary', flatIndex, 'description', e.target.value)} placeholder="Тайлбар" rows={2} />
                                                        <input type="file" accept="image/*" multiple onChange={(e) => handleTimelineBlockImages('itinerary', flatIndex, e.target.files)} className="inp" style={{ height: 'auto', paddingTop: 8, paddingBottom: 8, fontSize: 13 }} />
                                                        {c.images?.length > 0 && (
                                                            <div className="row" style={{ gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                                                                {c.images.map((img, imgIdx) => (
                                                                    <div key={imgIdx} style={{ position: 'relative', flex: 'none' }}>
                                                                        <img src={getOptimizedImageUrl(img, 'productThumbnail')} alt={`Зураг ${imgIdx + 1}`} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--r-md)', border: '1px solid var(--border-default)' }} />
                                                                        <button type="button" onClick={() => removeTimelineBlockImage('itinerary', flatIndex, imgIdx)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'var(--mrt-red)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon name="close" style={{ fontSize: 13 }} /></button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            if (block.type === 'image') {
                                                return (
                                                    <div className="block-img">
                                                        {block.content ? (
                                                            <div style={{ position: 'relative' }}>
                                                                <img src={getOptimizedImageUrl(block.content as string, 'productThumbnail')} alt="Блок зураг" />
                                                                <button type="button" onClick={() => updateItineraryBlockContent(flatIndex, '')} className="btn btn-ink btn-sm" style={{ position: 'absolute', top: 8, right: 8 }}>Солих</button>
                                                            </div>
                                                        ) : (
                                                            <label className="block-img-empty" style={{ cursor: 'pointer' }}>
                                                                <Icon name="add_photo_alternate" />Зураг байршуулах
                                                                <input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleItineraryBlockImageUpload(flatIndex, e.target.files[0]); }} style={{ display: 'none' }} />
                                                            </label>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            if (block.type === 'slide') {
                                                const c = block.content as DetailSlide;
                                                return (
                                                    <div className="stack" style={{ gap: 8 }}>
                                                        <input type="text" className="inp" value={c.title || ''} onChange={(e) => updateItinerarySlideInBlock(flatIndex, 'title', e.target.value)} placeholder="Галерейн гарчиг (сонголтоор)" />
                                                        <input type="file" accept="image/*" multiple onChange={(e) => handleItinerarySlideBlockImages(flatIndex, e.target.files)} className="inp" style={{ height: 'auto', paddingTop: 8, paddingBottom: 8, fontSize: 13 }} />
                                                        {c.images?.length > 0 && (
                                                            <div className="row" style={{ gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                                                                {c.images.map((img, imgIdx) => (
                                                                    <div key={imgIdx} style={{ position: 'relative', flex: 'none' }}>
                                                                        <img src={getOptimizedImageUrl(img, 'productThumbnail')} alt={`Галерей ${imgIdx + 1}`} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--r-md)', border: '1px solid var(--border-default)' }} />
                                                                        <button type="button" onClick={() => removeItinerarySlideBlockImage(flatIndex, imgIdx)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'var(--mrt-red)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon name="close" style={{ fontSize: 13 }} /></button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            // divider (line)
                                            const dvc = block.content as DividerContent;
                                            return (
                                                <div className="row" style={{ gap: 16, alignItems: 'flex-end' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Хэвтээ зураас</label>
                                                        <div style={{ height: 1, background: 'var(--border-strong)', width: '100%', marginBottom: 6 }} />
                                                    </div>
                                                    <div style={{ width: 140 }}>
                                                        <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Зай ({dvc.height}px)</label>
                                                        <input type="range" min="10" max="120" step="10" value={dvc.height} onChange={(e) => updateItineraryBlockContent(flatIndex, { ...dvc, height: parseInt(e.target.value) })} style={{ width: '100%' }} />
                                                    </div>
                                                </div>
                                            );
                                        };

                                        return (
                                            <div className="stack" style={{ gap: 14 }}>
                                                {pre.length > 0 && (
                                                    <div className="stack" style={{ gap: 10, border: '1px dashed var(--border-strong)', borderRadius: 'var(--r-lg)', padding: 14 }}>
                                                        <div className="row" style={{ gap: 6 }}><Icon name="info" /><span className="cell-strong" style={{ fontSize: 12.5 }}>Өдөрт хамаараагүй зүйлс</span></div>
                                                        <p className="muted" style={{ fontSize: 11, margin: 0 }}>「Хоног нэмэх」-ийг дарвал эдгээр нь эхний өдрийн агуулга болж харагдана.</p>
                                                        {pre.map((ev) => (
                                                            <div key={ev.block.id} data-itinerary-block={ev.block.id} className="edit-row" style={{ background: 'var(--mrt-gray-50, #f8f9fa)', borderRadius: 'var(--r-md)', padding: 10 }}>
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div className="row" style={{ gap: 8, marginBottom: 8 }}><span className="badge b-gray">{typeLabel(ev.block.type)}</span></div>
                                                                    {renderEventBody(ev.block, ev.flatIndex)}
                                                                </div>
                                                                <button type="button" className="act-btn danger" onClick={() => removeItineraryBlock(ev.flatIndex)} title="Устгах"><Icon name="delete" /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {days.length === 0 && (
                                                    <div style={{ textAlign: 'center', padding: '32px 16px', border: '1.5px dashed var(--border-strong)', borderRadius: 'var(--r-lg)', color: 'var(--mrt-gray-500)' }}>
                                                        <Icon name="event_note" style={{ fontSize: 32, opacity: 0.4 }} />
                                                        <div style={{ marginTop: 8, fontSize: 14 }}>Хоног одоогоор алга. Доорх товчоор эхний өдрийг нэмнэ үү.</div>
                                                    </div>
                                                )}

                                                {days.map((day, dayIdx) => {
                                                    const dc = day.dayInfo.content as DayInfoContent;
                                                    const collapsed = collapsedDays.has(day.dayInfo.id);
                                                    const showAdv = advancedDays.has(day.dayInfo.id);
                                                    const eventCount = day.events.filter((e) => e.block.type === 'timeline').length;
                                                    return (
                                                        <div key={day.dayInfo.id} data-itinerary-block={day.dayInfo.id} style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--r-lg)', overflow: 'hidden', background: '#fff' }}>
                                                            {/* Day header */}
                                                            <div className="row" style={{ gap: 8, alignItems: 'center', padding: '12px 14px', background: 'var(--mrt-gray-50, #f8f9fa)', borderBottom: collapsed ? 'none' : '1px solid var(--border-subtle)' }}>
                                                                <button type="button" className="act-btn" onClick={() => toggleDayCollapsed(day.dayInfo.id)} title={collapsed ? 'Дэлгэх' : 'Хураах'}><Icon name={collapsed ? 'expand_more' : 'expand_less'} /></button>
                                                                <input
                                                                    type="text"
                                                                    value={dc.dayLabel || ''}
                                                                    placeholder={`${dayIdx + 1}일차`}
                                                                    onChange={(e) => updateItineraryBlockContent(day.dayInfoFlatIndex, { ...dc, dayLabel: e.target.value })}
                                                                    title="Өдрийн шошго засах (일차 라벨 수정)"
                                                                    style={{ flex: 'none', width: 66, textAlign: 'center', fontWeight: 700, fontSize: 12, color: '#b45309', background: '#fef3c7', border: '1px solid transparent', borderRadius: 999, padding: '5px 6px', outline: 'none' }}
                                                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.background = '#fff'; }}
                                                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#fef3c7'; }}
                                                                />
                                                                <input type="text" className="inp" style={{ flex: 1, fontWeight: 700 }} value={dc.title || ''} onChange={(e) => updateItineraryBlockContent(day.dayInfoFlatIndex, { ...dc, title: e.target.value })} placeholder="Тухайн өдрийн гарчиг (Улаанбаатар → Тэрэлж)" />
                                                                {collapsed && eventCount > 0 && <span className="cell-muted" style={{ fontSize: 12, flex: 'none' }}>{eventCount} зүйл</span>}
                                                                <div className="edit-move" style={{ flex: 'none' }}>
                                                                    <button type="button" onClick={() => moveItineraryDay(dayIdx, -1)} disabled={dayIdx === 0}><Icon name="expand_less" /></button>
                                                                    <button type="button" onClick={() => moveItineraryDay(dayIdx, 1)} disabled={dayIdx === days.length - 1}><Icon name="expand_more" /></button>
                                                                </div>
                                                                <button type="button" className="act-btn" style={{ flex: 'none' }} onClick={() => duplicateItineraryDay(dayIdx)} title="Энэ өдрийг хуулбарлах (이 일차 복사)"><Icon name="content_copy" /></button>
                                                                <button type="button" className="act-btn danger" style={{ flex: 'none' }} onClick={() => { if (window.confirm(`${dc.dayLabel || `${dayIdx + 1}일차`}-ийг бүхэлд нь устгах уу?`)) removeItineraryDay(dayIdx); }} title="Энэ өдрийг устгах"><Icon name="delete" /></button>
                                                            </div>

                                                            {!collapsed && (
                                                                <div className="stack" style={{ gap: 12, padding: 14 }}>
                                                                    <div className="field-row">
                                                                        <div>
                                                                            <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Огноо (сонголтоор)</label>
                                                                            <input type="text" className="inp" value={dc.dayDate || ''} onChange={(e) => updateItineraryBlockContent(day.dayInfoFlatIndex, { ...dc, dayDate: e.target.value })} placeholder="05/26(Мяг)" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="muted" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Гол хөтөлбөрийн товч (сонголтоор)</label>
                                                                            <input type="text" className="inp" value={dc.description || ''} onChange={(e) => updateItineraryBlockContent(day.dayInfoFlatIndex, { ...dc, description: e.target.value })} placeholder="Их дэлгүүр, Тэрэлж, Мэлхий хад..." />
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <label className="cell-strong" style={{ fontSize: 12.5, display: 'block', marginBottom: 6 }}>🍽 Хоол</label>
                                                                        <div className="meal-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                                                            <div className="inp-mini"><span className="pre" style={{ fontSize: 11 }}>Өглөө</span><input value={dc.meals?.breakfast || ''} onChange={(e) => updateItineraryBlockContent(day.dayInfoFlatIndex, { ...dc, meals: { ...dc.meals, breakfast: e.target.value } })} placeholder="Буудлын хоол" /></div>
                                                                            <div className="inp-mini"><span className="pre" style={{ fontSize: 11 }}>Өдөр</span><input value={dc.meals?.lunch || ''} onChange={(e) => updateItineraryBlockContent(day.dayInfoFlatIndex, { ...dc, meals: { ...dc.meals, lunch: e.target.value } })} placeholder="Орон нутгийн хоол" /></div>
                                                                            <div className="inp-mini"><span className="pre" style={{ fontSize: 11 }}>Орой</span><input value={dc.meals?.dinner || ''} onChange={(e) => updateItineraryBlockContent(day.dayInfoFlatIndex, { ...dc, meals: { ...dc.meals, dinner: e.target.value } })} placeholder="Кэмпийн хоол" /></div>
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <div className="row" style={{ marginBottom: 6 }}>
                                                                            <label className="cell-strong" style={{ fontSize: 12.5 }}>🏠 Байр</label>
                                                                            <div className="spacer" style={{ flex: 1 }} />
                                                                            <button type="button" onClick={() => setHotelPickerForIndex(day.dayInfoFlatIndex)} className="btn btn-ghost btn-sm"><Icon name="hotel" />Мастераас сонгох</button>
                                                                        </div>
                                                                        <div className="inp-mini"><span className="pre"><Icon name="hotel" style={{ fontSize: 14 }} /></span>
                                                                            <input value={dc.accommodation || ''} onChange={(e) => updateItineraryBlockContent(day.dayInfoFlatIndex, { ...dc, accommodation: e.target.value, accommodationHotelId: undefined })} placeholder="Тусдаа ариун цэвэр·шүршүүртэй тансаг гэр (эсвэл мастераас сонгох)" />
                                                                        </div>
                                                                        {dc.accommodationHotelId && (
                                                                            <div className="row" style={{ gap: 4, marginTop: 6, fontSize: 11, color: 'var(--mrt-blue-strong)' }}><Icon name="link" style={{ fontSize: 14 }} />Мастераас сонгосон. Гараар бичвэл холбоос сална.</div>
                                                                        )}
                                                                    </div>

                                                                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                                                                        <label className="cell-strong" style={{ fontSize: 12.5, display: 'block', marginBottom: 8 }}><Icon name="timeline" style={{ fontSize: 16, verticalAlign: '-3px' }} /> Энэ өдрийн хөтөлбөр</label>
                                                                        {day.events.length === 0 && (
                                                                            <p className="muted" style={{ fontSize: 12, padding: '2px 0 8px', margin: 0 }}>Одоогоор зүйл алга. Доорх товчоор нэмнэ үү.</p>
                                                                        )}
                                                                        <div className="stack" style={{ gap: 10 }}>
                                                                            {day.events.map((ev, evIdx) => (
                                                                                <div key={ev.block.id} data-itinerary-block={ev.block.id} className="edit-row" style={{ background: 'var(--mrt-gray-50, #f8f9fa)', borderRadius: 'var(--r-md)', padding: 10 }}>
                                                                                    <div className="edit-move">
                                                                                        <button type="button" onClick={() => moveItineraryEvent(dayIdx, evIdx, -1)} disabled={evIdx === 0}><Icon name="expand_less" /></button>
                                                                                        <button type="button" onClick={() => moveItineraryEvent(dayIdx, evIdx, 1)} disabled={evIdx === day.events.length - 1}><Icon name="expand_more" /></button>
                                                                                    </div>
                                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                                        <div className="row" style={{ gap: 8, marginBottom: 8 }}><span className="badge b-gray">{typeLabel(ev.block.type)}</span></div>
                                                                                        {renderEventBody(ev.block, ev.flatIndex)}
                                                                                    </div>
                                                                                    <button type="button" className="act-btn danger" onClick={() => removeItineraryEvent(dayIdx, evIdx)} title="Устгах"><Icon name="delete" /></button>
                                                                                </div>
                                                                            ))}
                                                                        </div>

                                                                        <button type="button" onClick={() => addItineraryEvent(dayIdx, 'timeline')} className="add-line" style={{ marginTop: 10 }}><Icon name="add_circle" />Хөтөлбөрийн зүйл нэмэх</button>

                                                                        <div style={{ marginTop: 8 }}>
                                                                            <button type="button" onClick={() => toggleDayAdvanced(day.dayInfo.id)} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}><Icon name={showAdv ? 'expand_less' : 'tune'} />Нэмэлт (зураг·галерей·зураас)</button>
                                                                            {showAdv && (
                                                                                <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                                                                    <button type="button" onClick={() => addItineraryEvent(dayIdx, 'image')} className="chip"><Icon name="image" style={{ fontSize: 16 }} />1 зураг</button>
                                                                                    <button type="button" onClick={() => addItineraryEvent(dayIdx, 'slide')} className="chip"><Icon name="view_carousel" style={{ fontSize: 16 }} />Галерей</button>
                                                                                    <button type="button" onClick={() => addItineraryEvent(dayIdx, 'divider')} className="chip"><Icon name="horizontal_rule" style={{ fontSize: 16 }} />Зураас</button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                <button type="button" onClick={addItineraryDay} className="add-line" style={{ padding: 14, fontSize: 14, fontWeight: 700, borderWidth: 1.5 }}><Icon name="add" />Хоног нэмэх</button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Options Tab */}
                        {currentTab === 'options' && (
                            <div className="stack" style={{ maxWidth: 860 }}>
                                {/* Pricing Options */}
                                <section className="edit-sec">
                                    <div className="edit-sec-head">
                                        <Icon name="groups" />
                                        <h4>Хүний тооны үнийн сонголт</h4>
                                        <span className="muted">1 хүний үнэ · Урьдчилгаа · Газар дээрх төлбөр</span>
                                    </div>
                                    <div className="opt-grid-head"><span>Хүний тоо</span><span>1 хүний нийт үнэ</span><span>Урьдчилгаа</span><span>Газар дээрх төлбөр</span><span></span></div>
                                    <div className="stack" style={{ gap: 10 }}>
                                        {formData.pricingOptions?.map((option, index) => (
                                            <div className="edit-row" key={index}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="opt-grid">
                                                        <div className="inp-mini"><input type="number" value={option.people} onChange={(e) => updatePricingOption(index, 'people', Number(e.target.value))} /><span>хүн</span></div>
                                                        <div className="inp-mini"><span className="pre">₩</span><input type="number" value={option.pricePerPerson} onChange={(e) => updatePricingOption(index, 'pricePerPerson', Number(e.target.value))} /></div>
                                                        <div className="inp-mini"><span className="pre">₩</span><input type="number" value={option.depositPerPerson || 0} onChange={(e) => updatePricingOption(index, 'depositPerPerson', Number(e.target.value))} /></div>
                                                        <div className="inp-mini"><span className="pre">₩</span><input type="number" value={option.localPaymentPerPerson || 0} onChange={(e) => updatePricingOption(index, 'localPaymentPerPerson', Number(e.target.value))} /></div>
                                                    </div>
                                                </div>
                                                <button type="button" className="act-btn danger" onClick={() => removePricingOption(index)} title="Устгах"><Icon name="delete" /></button>
                                            </div>
                                        ))}
                                        {(!formData.pricingOptions || formData.pricingOptions.length === 0) && (
                                            <p className="muted" style={{ textAlign: 'center', padding: '8px 0', fontSize: 13 }}>Бүртгэсэн үнийн сонголт байхгүй.</p>
                                        )}
                                        <button type="button" className="add-line" onClick={addPricingOption}><Icon name="add" />Хүний тооны сонголт нэмэх</button>
                                    </div>
                                </section>

                                {/* Accommodation Options */}
                                <section className="edit-sec">
                                    <div className="edit-sec-head">
                                        <Icon name="hotel" />
                                        <h4>Байрны сонголт</h4>
                                        <span className="muted">Үндсэн 1-ийг сонгох</span>
                                    </div>
                                    <div className="stack" style={{ gap: 10 }}>
                                        {formData.accommodationOptions?.map((option, index) => (
                                            <div className="edit-row" key={index}>
                                                <div style={{ flex: 1, minWidth: 0 }} className="opt-card">
                                                    <div className="row" style={{ gap: 8 }}>
                                                        <button
                                                            type="button"
                                                            className={`radio${option.isDefault ? ' on' : ''}`}
                                                            onClick={() => updateAccommodationOption(index, 'isDefault', true)}
                                                            title="Үндсэн сонголт"
                                                        />
                                                        <input
                                                            type="text"
                                                            className="inp"
                                                            style={{ flex: 1 }}
                                                            value={option.name}
                                                            onChange={(e) => updateAccommodationOption(index, 'name', e.target.value)}
                                                            placeholder="Сонголтын нэр (жишээ: Гэр)"
                                                        />
                                                        <div className="inp-mini" style={{ width: 130 }}><span className="pre">+₩</span><input type="number" value={option.priceModifier} onChange={(e) => updateAccommodationOption(index, 'priceModifier', Number(e.target.value))} placeholder="0" /></div>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="inp"
                                                        style={{ marginTop: 8 }}
                                                        value={option.description}
                                                        onChange={(e) => updateAccommodationOption(index, 'description', e.target.value)}
                                                        placeholder="Сонголтын тайлбар"
                                                    />
                                                </div>
                                                <button type="button" className="act-btn danger" onClick={() => removeAccommodationOption(index)} title="Устгах"><Icon name="delete" /></button>
                                            </div>
                                        ))}
                                        <button type="button" className="add-line" onClick={addAccommodationOption}><Icon name="add" />Байрны сонголт нэмэх</button>
                                    </div>
                                </section>

                                {/* Vehicle Options */}
                                <section className="edit-sec">
                                    <div className="edit-sec-head">
                                        <Icon name="directions_car" />
                                        <h4>Тээврийн хэрэгслийн сонголт</h4>
                                        <span className="muted">Үндсэн 1-ийг сонгох</span>
                                    </div>
                                    <div className="stack" style={{ gap: 10 }}>
                                        {formData.vehicleOptions?.map((option, index) => (
                                            <div className="edit-row" key={index}>
                                                <div style={{ flex: 1, minWidth: 0 }} className="opt-card">
                                                    <div className="row" style={{ gap: 8 }}>
                                                        <button
                                                            type="button"
                                                            className={`radio${option.isDefault ? ' on' : ''}`}
                                                            onClick={() => updateVehicleOption(index, 'isDefault', true)}
                                                            title="Үндсэн сонголт"
                                                        />
                                                        <input
                                                            type="text"
                                                            className="inp"
                                                            style={{ flex: 1 }}
                                                            value={option.name}
                                                            onChange={(e) => updateVehicleOption(index, 'name', e.target.value)}
                                                            placeholder="Сонголтын нэр (жишээ: Старекс)"
                                                        />
                                                        <div className="inp-mini" style={{ width: 130 }}><span className="pre">+₩</span><input type="number" value={option.priceModifier} onChange={(e) => updateVehicleOption(index, 'priceModifier', Number(e.target.value))} placeholder="0" /></div>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="inp"
                                                        style={{ marginTop: 8 }}
                                                        value={option.description}
                                                        onChange={(e) => updateVehicleOption(index, 'description', e.target.value)}
                                                        placeholder="Сонголтын тайлбар"
                                                    />
                                                </div>
                                                <button type="button" className="act-btn danger" onClick={() => removeVehicleOption(index)} title="Устгах"><Icon name="delete" /></button>
                                            </div>
                                        ))}
                                        <button type="button" className="add-line" onClick={addVehicleOption}><Icon name="add" />Тээврийн хэрэгслийн сонголт нэмэх</button>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* Includes Tab */}
                        {currentTab === 'includes' && (
                            <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', gap: 18, maxWidth: 860 }}>
                                {/* Included */}
                                <section className="edit-sec">
                                    <div className="edit-sec-head">
                                        <Icon name="check_circle" style={{ color: 'var(--mrt-green)' }} />
                                        <h4>Багтсан зүйл</h4>
                                    </div>
                                    <div className="stack" style={{ gap: 8 }}>
                                        {formData.included?.map((item, index) => (
                                            <div className="row" style={{ gap: 8 }} key={index}>
                                                <Icon name="check_circle" style={{ color: 'var(--mrt-green)', fontSize: 18, flex: 'none' }} />
                                                <span style={{ flex: 1, fontSize: 13.5, color: 'var(--text-body)' }}>{item}</span>
                                                <button type="button" className="act-btn danger" onClick={() => removeIncluded(index)} title="Устгах"><Icon name="close" /></button>
                                            </div>
                                        ))}
                                        <input
                                            type="text"
                                            className="inp"
                                            placeholder="Багтсан зүйлийг бичээд Enter дарна уу"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addIncluded((e.target as HTMLInputElement).value);
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }}
                                        />
                                    </div>
                                </section>

                                {/* Excluded */}
                                <section className="edit-sec">
                                    <div className="edit-sec-head">
                                        <Icon name="cancel" style={{ color: 'var(--mrt-red)' }} />
                                        <h4>Багтаагүй зүйл</h4>
                                    </div>
                                    <div className="stack" style={{ gap: 8 }}>
                                        {formData.excluded?.map((item, index) => (
                                            <div className="row" style={{ gap: 8 }} key={index}>
                                                <Icon name="cancel" style={{ color: 'var(--mrt-red)', fontSize: 18, flex: 'none' }} />
                                                <span style={{ flex: 1, fontSize: 13.5, color: 'var(--text-body)' }}>{item}</span>
                                                <button type="button" className="act-btn danger" onClick={() => removeExcluded(index)} title="Устгах"><Icon name="close" /></button>
                                            </div>
                                        ))}
                                        <input
                                            type="text"
                                            className="inp"
                                            placeholder="Багтаагүй зүйлийг бичээд Enter дарна уу"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addExcluded((e.target as HTMLInputElement).value);
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }}
                                        />
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="card-pad row" style={{ justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border-subtle)' }}>
                        <button type="button" onClick={onClose} className="btn btn-ghost">
                            Цуцлах
                        </button>
                        <button type="submit" className="btn btn-ink">
                            <Icon name="check" />{product ? 'Засаж дуусгах' : 'Нэмж дуусгах'}
                        </button>
                    </div>
                </form>

                {/* Master pickers — open from either dayInfo or timeline buttons. */}
                <HotelPickerModal
                    open={hotelPickerTarget != null}
                    onPick={handleHotelPick}
                    onClose={() => setHotelPickerTarget(null)}
                />
                <TouristSpotPickerModal
                    open={spotPickerForIndex != null}
                    onPick={handleSpotPick}
                    onClose={() => setSpotPickerForIndex(null)}
                />
            </div >
        </div >
    );
};

// ============================================================================
// Itinerary Quick Actions — bulk image upload zone + N-day skeleton macro.
// Lives at the top of the "Itinerary" tab so adding many photos or stamping out a
// multi-day skeleton is one click away instead of a clicking marathon.
// ============================================================================
interface ItineraryQuickActionsProps {
    onBulkImages: (files: File[]) => void | Promise<void>;
    onSkeleton: (days: number) => void;
    uploading: boolean;
    progress: { done: number; total: number } | null;
}

const ItineraryQuickActions: React.FC<ItineraryQuickActionsProps> = ({
    onBulkImages,
    onSkeleton,
    uploading,
    progress,
}) => {
    const [drag, setDrag] = useState(false);
    const [skeletonDays, setSkeletonDays] = useState<number>(3);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFiles = (fileList: FileList | null) => {
        if (!fileList) return;
        const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
        if (files.length === 0) return;
        onBulkImages(files);
    };

    return (
        <div className="stack" style={{ gap: 12 }}>
            {/* ─── Bulk image drop zone ─── */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!uploading) setDrag(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDrag(false);
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDrag(false);
                    if (uploading) return;
                    handleFiles(e.dataTransfer.files);
                }}
                onClick={() => {
                    if (uploading) return;
                    fileInputRef.current?.click();
                }}
                style={{
                    position: 'relative',
                    width: '100%',
                    borderRadius: 'var(--r-lg)',
                    border: '1.5px dashed',
                    borderColor: drag ? 'var(--mrt-blue)' : 'var(--border-strong)',
                    background: drag ? 'var(--mrt-blue-50)' : (uploading ? 'var(--mrt-gray-50)' : '#fff'),
                    cursor: uploading ? 'wait' : 'pointer',
                    padding: '24px',
                    transition: 'all var(--dur-fast)',
                }}
                role="button"
                tabIndex={0}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        handleFiles(e.target.files);
                        // reset so picking the same files again still fires
                        e.target.value = '';
                    }}
                />
                <div className="row" style={{ gap: 14 }}>
                    <span className="metric-ico tint-blue" style={{ width: 44, height: 44, flex: 'none' }}>
                        <Icon name={uploading ? 'hourglass_top' : 'cloud_upload'} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="cell-strong" style={{ marginBottom: 2 }}>
                            {uploading
                                ? `Байршуулж байна... ${progress ? `${progress.done} / ${progress.total}` : ''}`
                                : 'Зургийг нэг дор байршуулах'}
                        </div>
                        <div className="cell-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
                            Хэд хэдэн зургийг энэ хайрцагт чирэх эсвэл дарж сонгоно уу. Зураг бүр автоматаар хөтөлбөрийн төгсгөлд нэмэгдэнэ.
                        </div>
                    </div>
                    {!uploading && (
                        <Icon name="add_photo_alternate" style={{ color: 'var(--mrt-gray-400)', fontSize: 22 }} />
                    )}
                </div>
            </div>

            {/* ─── N-day skeleton macro ─── */}
            <div className="row" style={{ gap: 12, flexWrap: 'wrap', padding: 16, borderRadius: 'var(--r-lg)', background: '#FFF3DC', border: '1px solid #F0DBA8' }}>
                <span className="metric-ico tint-amber" style={{ width: 40, height: 40, flex: 'none' }}>
                    <Icon name="calendar_view_day" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-strong" style={{ color: '#8a5a12' }}>N өдрийн хөтөлбөрийн араг яс үүсгэх</div>
                    <div style={{ fontSize: 12, color: '#9a6a22', marginTop: 2 }}>
                        1일차 ~ N일차 толгой ба зураасыг нэг дор үүсгэнэ. Өдөр бүрийг дэлгэж агуулгыг бөглөнө үү.
                    </div>
                </div>
                <div className="row" style={{ gap: 8, flex: 'none' }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#8a5a12' }}>Өдрийн тоо</label>
                    <select
                        value={skeletonDays}
                        onChange={(e) => setSkeletonDays(Number(e.target.value))}
                        className="select"
                        style={{ height: 36, fontSize: 13 }}
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <option key={n} value={n}>
                                {n} өдөр
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => onSkeleton(skeletonDays)}
                        className="btn btn-ink btn-sm"
                    >
                        <Icon name="add" />Үүсгэх
                    </button>
                </div>
            </div>
        </div>
    );
};
