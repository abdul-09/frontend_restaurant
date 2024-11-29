import axiosInstance from '../utils/axios';

export interface Category {
    id: number;
    name: string;
    slug: string;
}

export interface MenuItem {
    id: number;
    name: string;
    description: string;
    price: number;
    category: Category;
    featured: boolean;
    image: string;
    created: string;
    updated: string;
    available: boolean;
}


export interface CreateMenuItemDTO {
    name: string;
    description: string;
    price: number;
    category: number;
    featured: boolean;
    image?: File;
}

export const menuService = {
    // Get all menu items
    getMenuItems: async (): Promise<MenuItem[]> => {
        const response = await axiosInstance.get('/api/v1/menu-items/');
        return response.data.map((item: MenuItem) => ({
            ...item,
            available: item.available ?? true,
        }));
    },

    // Get a single menu item
    getMenuItem: async (id: number): Promise<MenuItem> => {
        const response = await axiosInstance.get(`/api/v1/menu-items/${id}/`);
        return {
            ...response.data,
            available: response.data.available ?? true,
        };
    },

    // Create a new menu item
    createMenuItem: async (formData: FormData): Promise<MenuItem> => {
        const response = await axiosInstance.post('/api/v1/menu-items/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return {
            ...response.data,
            available: response.data.available ?? true,
        };
    },

    // Update a menu item
    updateMenuItem: async (id: number, formData: FormData): Promise<MenuItem> => {
        const response = await axiosInstance.patch(`/api/v1/menu-items/${id}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return {
            ...response.data,
            available: response.data.available ?? true,
        };
    },

    // Delete a menu item
    deleteMenuItem: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/api/v1/menu-items/${id}/`);
    },

    // Get all categories
    getCategories: async (): Promise<Category[]> => {
        const response = await axiosInstance.get('/api/v1/categories/');
        return response.data;
    },

    // Create a new category
    createCategory: async (name: string): Promise<Category> => {
        const response = await axiosInstance.post('/api/v1/categories/', { name });
        return response.data;
    },

    // Update a category
    updateCategory: async (id: number, name: string): Promise<Category> => {
        const response = await axiosInstance.patch(`/api/v1/categories/${id}/`, { name });
        return response.data;
    },

    // Delete a category
    deleteCategory: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/api/v1/categories/${id}/`);
    },

    // Toggle featured status
    toggleFeatured: async (id: number, featured: boolean): Promise<MenuItem> => {
        const response = await axiosInstance.patch(`/api/v1/menu-items/${id}/`, {
            featured,
        });
        return {
            ...response.data,
            available: response.data.available ?? true,
        };
    },
};