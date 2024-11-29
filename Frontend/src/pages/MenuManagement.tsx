import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuItem, menuService } from '../services/menuService';
import { Loader } from '../components/ui/Loader';
import MenuItemForm from '../components/menu/MenuItemForm';
import toast from 'react-hot-toast';

export default function MenuManagement() {
  const queryClient = useQueryClient();
  const { data: menuItems, isLoading, error } = useQuery({
    queryKey: ['menuItems'],
    queryFn: menuService.getMenuItems,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: menuService.getCategories,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | undefined>(undefined);

  const mutation = useMutation({
    mutationFn: menuService.deleteMenuItem,
    onSuccess: () => {
      toast.success('Item deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
    onError: () => {
      toast.error('Failed to delete item');
    },
  });

  const handleAddNewItem = () => {
    setEditItem(undefined);
    setIsFormOpen(true);
  };

  const handleEditItem = (item: MenuItem | null) => {
    setEditItem(item || undefined);
    setIsFormOpen(true);
  };

  const handleDeleteItem = (id: number) => {
    mutation.mutate(id);
  };

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    queryClient.invalidateQueries({ queryKey: ['menuItems'] });
  };

  return (
    <div>
      <button
        onClick={handleAddNewItem}
        className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
      >
        Add New Item
      </button>

      {isFormOpen && (
        <MenuItemForm
          item={editItem}
          categories={categories || []}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {isLoading ? (
        <Loader />
      ) : error ? (
        <div>Error loading menu items</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems?.map((item: MenuItem) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-gray-600">${item.price}</p>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => handleEditItem(item)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 