import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Filter,
  MoreVertical,
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  key: string;
  sortable?: boolean;
  exportable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  title?: string;
}

export function DataTable<T extends { id: string }>({ 
  data, 
  columns, 
  searchPlaceholder = "Search...", 
  onRowClick,
  actions,
  title
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>(
    columns.filter(c => c.exportable !== false).map(c => c.key)
  );

  // Filtering
  const filteredData = useMemo(() => {
    return data.filter(item => {
      return Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = () => {
    const exportColumns = columns.filter(c => selectedExportColumns.includes(c.key));
    const headers = exportColumns.map(c => c.header).join(',');
    const rows = filteredData.map(item => {
      return exportColumns.map(c => {
        const value = typeof c.accessor === 'function' ? '' : item[c.accessor as keyof T];
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  const toggleColumn = (key: string) => {
    setSelectedExportColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 transition-colors">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
          />
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-sm font-medium"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                {columns.map((col) => (
                  <th key={col.key} className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {col.header}
                  </th>
                ))}
                {actions && <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              <AnimatePresence mode="wait">
                {paginatedData.map((item) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={() => onRowClick?.(item)}
                    className={`${onRowClick ? 'cursor-pointer' : ''} hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {typeof col.accessor === 'function' 
                          ? col.accessor(item) 
                          : (item[col.accessor as keyof T] as React.ReactNode)}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          {actions(item)}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic">
                    No records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="font-medium text-gray-900 dark:text-white">{filteredData.length}</span> results
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={20} className="dark:text-white" />
              </button>
              <div className="flex items-center space-x-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === i + 1 
                        ? 'bg-emerald-600 text-white' 
                        : 'hover:bg-gray-200 dark:hover:bg-slate-700 dark:text-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={20} className="dark:text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800"
            >
              <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Export Data</h3>
                <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Select columns you want to include in the CSV export.</p>
                <div className="grid grid-cols-1 gap-2">
                  {columns.filter(c => c.exportable !== false).map(col => (
                    <button
                      key={col.key}
                      onClick={() => toggleColumn(col.key)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        selectedExportColumns.includes(col.key)
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                          : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span className="font-medium">{col.header}</span>
                      {selectedExportColumns.includes(col.key) && <Check size={18} />}
                    </button>
                  ))}
                </div>
                <div className="pt-4">
                  <button 
                    onClick={handleExport}
                    disabled={selectedExportColumns.length === 0}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    Download CSV
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
