import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../utils/axios';
import { MenuItem } from '../../types/menu';
import cartService from '../../services/cartService';

interface MenuListProps {
  selectedCategory: string | null;
  searchQuery: string;
  sortBy: string;
}

export default function MenuList({ selectedCategory, searchQuery, sortBy }: MenuListProps) {
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const response = await axiosInstance.get('api/v1/menu-items/');
      return response.data;
    },
  });

  const handleAddToCart = async (item: MenuItem) => {
    try {
      await cartService.addToCart({
        menuitem: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image,
      });
      console.log("sent to backend")
      toast.success(`${item.name} added to cart`);
    } catch (error) {
      toast.error('Failed to add item to cart');
      console.error(error)
    }
  };

  const filteredMenuItems = menuItems
    .filter((item: MenuItem) =>
      (selectedCategory ? item.category?.toString() === selectedCategory : true) &&
      (item.name ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : false)
    )
    .sort((a: MenuItem, b: MenuItem) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });

  return (
    <div className="space-y-4">
      {filteredMenuItems.map((item: MenuItem) => (
        <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex">
            <div className="w-48 h-48">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
                  <p className="mt-2 text-gray-500">{item.description}</p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Heart className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900">Nutritional Info</h4>
                {/* <div className="mt-2 flex space-x-4">
                  <span className="text-sm text-gray-500">
                    {item.nutritionalInfo.calories} cal
                  </span>
                  <span className="text-sm text-gray-500">
                    {item.nutritionalInfo.protein}g protein
                  </span>
                  <span className="text-sm text-gray-500">
                    {item.nutritionalInfo.carbs}g carbs
                  </span>
                  <span className="text-sm text-gray-500">
                    {item.nutritionalInfo.fat}g fat
                  </span>
                </div> */}
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  ${item.price.toFixed(2)}
                </span>
                <button 
                  onClick={() => handleAddToCart(item)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}