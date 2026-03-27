import { Http } from "../constants/api";

export interface Plant {
  id: string;
  name: string;
  description: string;
  season: string;
  photo: string | null;
  watering_frequency?: number;
  fertilizing_frequency?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserPlant {
  id: string;
  color: string;
  plant: Plant;
  room?: string;
  customCare?: any[];
  plant_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  text: string;
  user_plant_id: string;
  created_at?: string;
  updated_at?: string;
}

export const getAllPlants = async (): Promise<Plant[]> => {
  try {
    const response = await Http.get('/plants');
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке растений:', error);
    throw error;
  }
};

export const getPlantsBySeason = async (season: string): Promise<Plant[]> => {
  try {
    const response = await Http.get(`/plants/season/${season}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке растений по сезону:', error);
    throw error;
  }
};

export const searchPlants = async (name: string): Promise<Plant[]> => {
  try {
    const response = await Http.get(`/plants/search?name=${encodeURIComponent(name)}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при поиске растений:', error);
    throw error;
  }
};

export const getPlantById = async (id: string): Promise<Plant> => {
  try {
    const response = await Http.get(`/plants/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке растения:', error);
    throw error;
  }
};

export const getUserPlants = async (): Promise<UserPlant[]> => {
  try {
    const response = await Http.get('/users_plants');
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке растений пользователя:', error);
    throw error;
  }
};

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

export const updateUserPlant = async (userPlantId: string, data: { color?: string; room?: string }): Promise<UserPlant> => {
  try {
    const response = await Http.patch(`/users_plants/${userPlantId}`, data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении растения:', error);
    throw error;
  }
};

export const deleteUserPlant = async (userPlantId: string): Promise<void> => {
  try {
    await Http.delete(`/users_plants/${userPlantId}`);
  } catch (error) {
    console.error('Ошибка при удалении растения:', error);
    throw error;
  }
};

export const getCommentsByUserPlant = async (userPlantId: string): Promise<Comment[]> => {
  try {
    const response = await Http.get(`/comments/user-plant/${userPlantId}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке комментариев:', error);
    throw error;
  }
};

export const createComment = async (userPlantId: string, text: string): Promise<Comment> => {
  try {
    const response = await Http.post('/comments', {
      user_plant_id: userPlantId,
      text: text
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании комментария:', error);
    throw error;
  }
};

export const updateComment = async (commentId: string, text: string): Promise<Comment> => {
  try {
    const response = await Http.patch(`/comments/${commentId}`, { text });
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении комментария:', error);
    throw error;
  }
};

export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    await Http.delete(`/comments/${commentId}`);
  } catch (error) {
    console.error('Ошибка при удалении комментария:', error);
    throw error;
  }
};

export const getUserComments = async (): Promise<Comment[]> => {
  try {
    const response = await Http.get('/comments/user');
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке комментариев пользователя:', error);
    throw error;
  }
};

export default {
  getAllPlants,
  getPlantsBySeason,
  searchPlants,
  getPlantById,
  getUserPlants,
  addUserPlant,
  updateUserPlant,
  deleteUserPlant,
  getCommentsByUserPlant,
  createComment,
  updateComment,
  deleteComment,
  getUserComments,
};