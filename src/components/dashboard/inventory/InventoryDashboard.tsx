"use client";

import { motion } from "framer-motion";
import { Package, AlertTriangle, TrendingUp, Search, Plus, ArrowDownCircle, Edit, Trash2, History, Users, Warehouse, Layers, ClipboardCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CreateProductModal } from "@/components/dashboard/inventory/SimpleProductModal";
import { ReceiveStockModal } from "@/components/dashboard/inventory/ReceiveStockModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ManualAdjustmentModal } from "@/components/dashboard/inventory/ManualAdjustmentModal";
import { ProductBatchesModal } from "@/components/dashboard/inventory/ProductBatchesModal";
import { deleteProduct } from "@/actions/inventory";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

// Client Component for Search/Filter Logic
export default function InventoryDashboard({ initialProducts, stats, billingEnabled = true, userRole = "staff" }: { initialProducts: any[], stats: any, billingEnabled?: boolean, userRole?: string }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState(initialProducts);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<any>(null);
    const [productToDelete, setProductToDelete] = useState<{ id: string, name: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const router = useRouter();

    // Escaneo de código de barras a nivel del catálogo general
    useBarcodeScanner({
        onScan: (barcode) => {
            const foundProduct = products.find(p => p.barcode === barcode);
            if (foundProduct) {
                toast.success(`Producto detectado: ${foundProduct.name}`);
                setSearchTerm(barcode); // Autofiltramos el catálogo por el código de barras
            } else {
                toast.info(`Código de barras "${barcode}" no registrado. Abriendo formulario de registro...`);
                setProductToEdit({ barcode }); // Pasamos el barcode para que el modal se inicialice con él
                setIsCreateModalOpen(true);
            }
        }
    });

    // Adjust items per page based on screen size (5 for mobile, 10 for desktop)
    useEffect(() => {
        const handleResize = () => setItemsPerPage(window.innerWidth < 768 ? 5 : 10);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Sync state when props change (e.g. after router.refresh())
    // Using useEffect for simplicity and correctness to sync state with props
    useEffect(() => {
        setProducts(initialProducts);
    }, [initialProducts]);

    // Helper for translations
    const unitMap: Record<string, string> = {
        'unit': 'Unidad',
        'ml': 'ml',
        'box': 'Caja',
        'kg': 'Kg'
    };

    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [isBatchesModalOpen, setIsBatchesModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    const openReceiveModal = (product: any) => {
        setSelectedProduct(product);
        setIsReceiveModalOpen(true);
    };

    const openAdjustModal = (product: any) => {
        setSelectedProduct(product);
        setIsAdjustModalOpen(true);
    };

    const openBatchesModal = (product: any) => {
        setSelectedProduct(product);
        setIsBatchesModalOpen(true);
    };

    const handleEdit = (product: any) => {
        setProductToEdit(product);
        setIsCreateModalOpen(true);
    };

    const handleDeleteClick = (product: any) => {
        setProductToDelete({ id: product.id, name: product.name });
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        const res = await deleteProduct(productToDelete.id);
        if (res.success) {
            toast.success(res.message);
            // Optimistic update: Remove immediately from UI
            setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
            router.refresh();
        } else {
            toast.error(res.message);
        }
        setProductToDelete(null);
    };

    // Reset edit state when closing modal
    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setProductToEdit(null);
    };

    // Filter and Pagination logic
    // Busca por Nombre, Categoría o Código de barras
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-8">
            {/* Header & Main Actions */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black font-heading text-foreground tracking-tight">Inventario Inteligente</h1>
                    <p className="text-muted-foreground font-medium">Gestión integral de existencias, lotes y logística.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    {/* Secondary Actions Group */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-[22px] border border-border/40 w-full md:w-auto">
                        <Link href="/dashboard/inventory/movements" className="flex-1 md:flex-none">
                            <button className="flex items-center justify-center gap-2 px-4 py-2.5 hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-[18px] font-bold text-xs transition-all w-full">
                                <TrendingUp size={16} />
                                Historial
                            </button>
                        </Link>
                        {userRole !== 'vet' && (
                            <>
                                <Link href="/dashboard/inventory/suppliers" className="flex-1 md:flex-none">
                                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-[18px] font-bold text-xs transition-all w-full">
                                        <Users size={16} />
                                        Proveedores
                                    </button>
                                </Link>
                                <Link href="/dashboard/inventory/warehouses" className="flex-1 md:flex-none">
                                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-[18px] font-bold text-xs transition-all w-full">
                                        <Warehouse size={16} />
                                        Almacenes
                                    </button>
                                </Link>
                            </>
                        )}
                        <Link href="/dashboard/inventory/kits" className="flex-1 md:flex-none">
                            <button className="flex items-center justify-center gap-2 px-4 py-2.5 hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-[18px] font-bold text-xs transition-all w-full">
                                <Layers size={16} />
                                Kits
                            </button>
                        </Link>
                        <Link href="/dashboard/inventory/requisitions" className="flex-1 md:flex-none">
                            <button className="flex items-center justify-center gap-2 px-4 py-2.5 hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-[18px] font-bold text-xs transition-all w-full">
                                <ClipboardCheck size={16} />
                                Requisiciones
                            </button>
                        </Link>
                        {userRole !== 'vet' && (
                            <Link href="/dashboard/inventory/audits" className="flex-1 md:flex-none">
                                <button className="flex items-center justify-center gap-2 px-4 py-2.5 hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-[18px] font-bold text-xs transition-all w-full">
                                    <ClipboardCheck size={16} />
                                    Auditorías
                                </button>
                            </Link>
                        )}
                    </div>

                    {/* Primary Action */}
                    {userRole !== 'vet' && (
                        <button
                            onClick={() => {
                                setProductToEdit(null);
                                setIsCreateModalOpen(true);
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-[22px] font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 w-full sm:w-auto"
                        >
                            <Plus size={18} />
                            Nuevo Producto
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-border/40 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-primary/20 transition-all"
                >
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                        <Package size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Productos</p>
                        <h3 className="text-3xl font-black text-foreground">{stats.totalProducts}</h3>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-border/40 dark:border-slate-800 shadow-sm flex items-center gap-4 group hover:border-orange-500/20 transition-all"
                >
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl group-hover:scale-110 transition-transform">
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Stock Bajo / Crítico</p>
                        <h3 className="text-3xl font-black text-orange-600">{stats.lowStock}</h3>
                    </div>
                </motion.div>

                {billingEnabled && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-border/40 dark:border-slate-800 shadow-sm flex items-center gap-4"
                    >
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Valor Inventario (Est.)</p>
                            <h3 className="text-2xl font-bold text-emerald-700">${(stats.totalValue || 0).toFixed(2)}</h3>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Product Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-border/40 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border/40 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <h2 className="text-xl font-bold text-foreground">Catálogo de Productos</h2>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-foreground"
                        />
                    </div>
                </div>

                <div className="w-full overflow-x-auto scrollbar-thin">
                    <table className="w-full min-w-[850px]">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-border/40 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Categoría</th>
                                {billingEnabled && <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Precio Venta</th>}
                                <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Stock Total</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 dark:divide-slate-800">
                            {currentProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                                <Package className="text-primary w-8 h-8 opacity-80" />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1">Sin productos</h3>
                                            <p className="text-muted-foreground text-sm max-w-sm mb-4">No se encontraron productos con ese criterio de búsqueda o el inventario está vacío.</p>
                                            <button 
                                                onClick={() => setIsCreateModalOpen(true)} 
                                                className="text-primary font-bold text-sm hover:underline flex items-center gap-1"
                                            >
                                                <Plus size={16} /> Crear Producto
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentProducts.map((product) => {
                                    let statusColor = "";
                                    let statusText = "";
 
                                    if (product.category === 'Service' || product.category === 'Other') {
                                        statusColor = "bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700";
                                        statusText = "-";
                                    } else if (product.totalStock === 0) {
                                        statusColor = "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50";
                                        statusText = "Agotado";
                                    } else if (product.totalStock <= (product.min_stock_level || 5)) {
                                        statusColor = "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50";
                                        statusText = "Bajo Stock";
                                    } else {
                                        statusColor = "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50";
                                        statusText = "Disponible";
                                    }
 
                                    return (
                                        <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="font-bold text-foreground text-sm">{product.name}</div>
                                                    <div className="flex gap-2 items-center">
                                                        {product.sku && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-muted-foreground font-mono">SKU: {product.sku}</span>}
                                                        {product.barcode && <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono">BC: {product.barcode}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
                                                    {product.category}
                                                </span>
                                            </td>
                                            {billingEnabled && (
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground text-sm">
                                                    ${Number(product.sale_price || 0).toFixed(2)}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold">
                                                <div>
                                                    {product.category === 'Service' || product.category === 'Other' ? (
                                                        <span className="font-medium text-slate-400">-</span>
                                                    ) : (
                                                        <>
                                                            <span className="font-bold text-slate-700 dark:text-slate-200">{product.totalStock}</span>
                                                            <span className="text-xs font-normal text-muted-foreground ml-1">{unitMap[product.unit] || product.unit}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColor}`}>
                                                        {statusText}
                                                    </span>
                                                    {product.isExpired ? (
                                                        <div className="mt-1 text-[10px] text-red-600 font-bold flex flex-col items-center justify-center">
                                                            <span>❌ Vencido</span>
                                                            {product.closestExpiry && (
                                                                <span className="text-red-500 font-medium">{format(new Date(product.closestExpiry), "dd/MM/yyyy")}</span>
                                                            )}
                                                        </div>
                                                    ) : product.hasExpiring ? (
                                                        <div className="mt-1 text-[10px] text-orange-600 font-bold flex flex-col items-center justify-center">
                                                            <span>⚠️ Vence Prox.</span>
                                                            {product.closestExpiry && (
                                                                <span className="text-orange-400 font-medium">{format(new Date(product.closestExpiry), "dd/MM/yyyy")}</span>
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2 w-full">
                                                    {userRole !== 'vet' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEdit(product)}
                                                                className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(product)}
                                                                className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => openBatchesModal(product)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                        title="Ver Lotes y Vencimientos"
                                                    >
                                                        <Package size={16} />
                                                    </button>
                                                    <Link href={`/dashboard/inventory/movements?productId=${product.id}`}>
                                                        <button
                                                            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                            title="Historial"
                                                        >
                                                            <History size={16} />
                                                        </button>
                                                    </Link>
                                                    {product.category !== 'Service' && product.category !== 'Other' && (
                                                        <>
                                                            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                                            {userRole !== 'vet' && (
                                                                <button
                                                                    onClick={() => openReceiveModal(product)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg font-bold text-xs transition-colors border border-indigo-100 dark:border-indigo-900/50"
                                                                    title="Ingreso de Compra"
                                                                >
                                                                    <ArrowDownCircle size={14} /> Stock
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => openAdjustModal(product)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg font-bold text-xs transition-colors border border-amber-100 dark:border-amber-900/50"
                                                                title="Ajuste Manual / Autoconsumo"
                                                            >
                                                                <AlertTriangle size={14} /> Ajuste
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-border/40 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/50 gap-4">
                        <span className="text-sm font-medium text-muted-foreground">
                            Mostrando <strong className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</strong> a <strong className="text-slate-800 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</strong> de <strong className="text-slate-800 dark:text-slate-200">{filteredProducts.length}</strong> productos
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                            >
                                Anterior
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <CreateProductModal
                isOpen={isCreateModalOpen}
                onClose={closeCreateModal}
                productToEdit={productToEdit}
            />

            <ReceiveStockModal
                isOpen={isReceiveModalOpen}
                onClose={() => setIsReceiveModalOpen(false)}
                product={selectedProduct}
            />

            <ManualAdjustmentModal
                isOpen={isAdjustModalOpen}
                onClose={() => setIsAdjustModalOpen(false)}
                product={selectedProduct}
            />

            <ProductBatchesModal
                isOpen={isBatchesModalOpen}
                onClose={() => setIsBatchesModalOpen(false)}
                product={selectedProduct}
            />

            <ConfirmationModal
                isOpen={!!productToDelete}
                onClose={() => setProductToDelete(null)}
                onConfirm={confirmDelete}
                title="¿Eliminar Producto?"
                description={`Estás a punto de archivar "${productToDelete?.name}". El producto ya no será visible en el catálogo principal.`}
                confirmText="Sí, Eliminar"
                isDestructive={true}
            />
        </div>
    );
}
