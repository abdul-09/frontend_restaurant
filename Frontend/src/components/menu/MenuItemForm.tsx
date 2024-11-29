import React, { useState } from 'react';
import { MenuItem, Category } from '../../types/menu';
import { menuService } from '../../services/menuService';
import toast from 'react-hot-toast';

interface MenuItemFormProps {
    item?: MenuItem;
    categories: Category[];
    onSubmit: () => void;
    onCancel: () => void;
}

export default function MenuItemForm({ item, categories, onSubmit, onCancel }: MenuItemFormProps) {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        description: item?.description || '',
        price: item?.price || 0, // Ensure price is a number
        category: item?.category.id || 0, // Ensure category is a number
        available: item?.available || false,
    });
    const [image, setImage] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, String(value));
            });
            if (image) {
                formDataToSend.append('image', image);
            }

            if (item) {
                await menuService.updateMenuItem(item.id, formDataToSend);
                toast.success('Item updated successfully');
            } else {
                await menuService.createMenuItem(formDataToSend);
                toast.success('Item created successfully');
            }
            onSubmit();
        } catch (error) {
            toast.error('Failed to save item');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                >
                    <option value={0}>Select a category</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Available</label>
                <input
                    type="checkbox"
                    name="available"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="mt-1"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Image</label>
                <input
                    type="file"
                    name="image"
                    onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
                    className="mt-1 block w-full"
                />
            </div>

            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isSubmitting ? 'Saving...' : item ? 'Update' : 'Create'}
                </button>
            </div>
        </form>
    );
}