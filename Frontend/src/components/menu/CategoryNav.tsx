import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../utils/axios';
import { Category } from '../../types/menu';

interface CategoryNavProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export default function CategoryNav({ selectedCategory, onSelectCategory }: CategoryNavProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axiosInstance.get('api/v1/categories/');
      return response.data;
    },
  });

  return (
    <div className="flex overflow-x-auto pb-2 -mx-6 px-6">
      <div className="flex space-x-4">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-4 py-2 rounded-full whitespace-nowrap ${
            selectedCategory === null
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          All Items
        </button>
        
        {categories.map((category: Category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id.toString())}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              selectedCategory === category.id.toString()
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}