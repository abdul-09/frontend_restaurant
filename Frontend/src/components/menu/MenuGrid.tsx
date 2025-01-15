// import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../utils/axios';
import { MenuItem } from '../../types/menu';
// import { useCartStore } from '../../store/cartStore';
import cartService from '../../services/cartService';
import { CartItem } from '../../types/cart';
import { useCartStore } from '../../store/cartStore';

interface MenuGridProps {
  selectedCategory: string | null;
  searchQuery: string;
  sortBy: string;
}

export default function MenuGrid({ selectedCategory, searchQuery, sortBy }: MenuGridProps) {

  const setCart = useCartStore((state) => state.setCart);

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const response = await axiosInstance.get('api/v1/menu-items/');
      return response.data.map((item: MenuItem) => ({
        ...item,
        price: parseFloat(item.price.toString()),
      }));
    },
  });

  // console.log('Fetched menu items:', menuItems);
  // console.log('Selected Category:', selectedCategory);

  // const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = async (menuItem: MenuItem) => {
    const cartItem: Omit<CartItem, 'id'> = {
      menuitem: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: 1,
      image: menuItem.image
    };
    try {
      await cartService.addToCart(cartItem, setCart);
      console.log("sent to backend")
      toast.success(`${menuItem.name} added to cart`);
    } catch (error) {
      toast.error('Failed to add item to cart');
      console.error(error)
    }
  };

  const filteredMenuItems = menuItems
    .filter((item: MenuItem) => {
      console.log('Item Category ID:', item.category);
      return (
        (selectedCategory ? item.category?.toString() === selectedCategory : true) &&
        (item.name ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : false)
      );
    })
    .sort((a: MenuItem, b: MenuItem) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });
  console.log('Filtered Menu Items:', filteredMenuItems);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredMenuItems.map((item: MenuItem) => (
        <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="relative h-48">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
              <Heart className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>
            
            <div className="mt-4 flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">${item.price.toFixed(2)}</span>
              <button 
                onClick={() => handleAddToCart(item)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}