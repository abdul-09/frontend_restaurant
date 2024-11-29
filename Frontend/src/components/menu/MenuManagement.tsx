import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { menuService } from '../../services/menuService';
import { MenuItem } from '../../types/menu';
import toast from 'react-hot-toast';

export default function MenuManagement() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadMenuItems();
    }, []);

    const loadMenuItems = async () => {
        try {
            const data = await menuService.getMenuItems();
            setMenuItems(data);
        } catch (error) {
            toast.error('Failed to load menu items');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await menuService.deleteMenuItem(id);
                toast.success('Item deleted successfully');
                loadMenuItems();
            } catch (error) {
                toast.error('Failed to delete item');
                console.error(error);
            }
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Menu Management</h1>
                <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    onClick={() => {/* Open create modal */}}
                >
                    <Plus className="w-4 h-4" />
                    Add Item
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow-md p-4">
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-lg font-semibold">{item.name}</h3>
                                <p className="text-gray-600">${item.price}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {/* Open edit modal */}}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">{item.description}</p>
                        <div className="mt-2">
                            <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                                {item.category.name}
                            </span>
                            {item.featured && (
                                <span className="ml-2 text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                    Featured
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 