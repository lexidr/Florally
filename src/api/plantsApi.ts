import { Http } from "../constants/api";

export interface Plant {
  id: string;
  name: string;
  description: string;
  season: string;
  photo: string | null;
}

export interface UserPlant {
  id: string;
  color: string;
  plant: Plant;
  room?: string;
  customCare?: any[];
}

// Получить все растения из базы
export const getAllPlants = async (): Promise<Plant[]> => {
  try {
    const response = await Http.get('/plants');
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке растений:', error);
    throw error;
  }
};

// Получить растения по сезону
export const getPlantsBySeason = async (season: string): Promise<Plant[]> => {
  try {
    const response = await Http.get(`/plants/season/${season}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке растений по сезону:', error);
    throw error;
  }
};

// Поиск растений по названию
export const searchPlants = async (name: string): Promise<Plant[]> => {
  try {
    const response = await Http.get(`/plants/search?name=${encodeURIComponent(name)}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при поиске растений:', error);
    throw error;
  }
};

// Получить растение по ID
export const getPlantById = async (id: string): Promise<Plant> => {
  try {
    const response = await Http.get(`/plants/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке растения:', error);
    throw error;
  }
};

// Получить все растения пользователя
export const getUserPlants = async (): Promise<UserPlant[]> => {
  try {
    const response = await Http.get('/users_plants');
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке растений пользователя:', error);
    throw error;
  }
};

// Добавить растение пользователю
export const addUserPlant = async (plantId: string, color: string = '#FFFFFF'): Promise<UserPlant> => {
  try {
    const response = await Http.post('/users_plants', {
      plantId,
      color
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при добавлении растения:', error);
    throw error;
  }
};

// Обновить растение пользователя
export const updateUserPlant = async (userPlantId: string, data: { color?: string; room?: string }): Promise<UserPlant> => {
  try {
    const response = await Http.patch(`/users_plants/${userPlantId}`, data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении растения:', error);
    throw error;
  }
};

// Удалить растение пользователя
export const deleteUserPlant = async (userPlantId: string): Promise<void> => {
  try {
    await Http.delete(`/users_plants/${userPlantId}`);
  } catch (error) {
    console.error('Ошибка при удалении растения:', error);
    throw error;
  }
};