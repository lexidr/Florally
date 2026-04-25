import { Http } from "../constants/api";

export interface Room {
  id: string;
  name: string;
  user_id: string;
  userPlants: UserPlant[];
  created_at?: string;
  updated_at?: string;
}

export interface UserPlant {
  id: string;
  color: string;
  plant: Plant;
  room?: Room;
  room_id?: string;
  plant_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Plant {
  id: string;
  name: string;
  description: string;
  season: string;
  photo: string | null;
  watering_frequency?: number;
  fertilizing_frequency?: number;
}

export const getUserRooms = async (): Promise<Room[]> => {
  try {
    const response = await Http.get('/user_rooms');
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке комнат:', error);
    throw error;
  }
};

export const getRoomById = async (roomId: string): Promise<Room> => {
  try {
    const response = await Http.get(`/user_rooms/${roomId}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке комнаты:', error);
    throw error;
  }
};

export const createRoom = async (name: string, userPlantIds?: string[]): Promise<Room> => {
  try {
    const response = await Http.post('/user_rooms', {
      name,
      ...(userPlantIds && { userPlantIds })
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании комнаты:', error);
    throw error;
  }
};

export const updateRoom = async (
  roomId: string, 
  data: { name?: string; userPlantIds?: string[] }
): Promise<Room> => {
  try {
    const response = await Http.patch(`/user_rooms/${roomId}`, data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении комнаты:', error);
    throw error;
  }
};

export const deleteRoom = async (roomId: string): Promise<{ message: string }> => {
  try {
    const response = await Http.delete(`/user_rooms/${roomId}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении комнаты:', error);
    throw error;
  }
};

export const addPlantToRoom = async (
  roomId: string, 
  userPlantId: string
): Promise<Room> => {
  try {
    const response = await Http.post(`/user_rooms/${roomId}/plants/${userPlantId}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при добавлении растения в комнату:', error);
    throw error;
  }
};

export const removePlantFromRoom = async (
  roomId: string, 
  userPlantId: string
): Promise<Room> => {
  try {
    const response = await Http.delete(`/user_rooms/${roomId}/plants/${userPlantId}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении растения из комнаты:', error);
    throw error;
  }
};

export default {
  getUserRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  addPlantToRoom,
  removePlantFromRoom,
};
