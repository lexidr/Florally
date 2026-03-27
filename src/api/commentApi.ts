import { Http } from "../constants/api";

export interface Comment {
  id: string;
  text: string;
  userPlant: {
    id: string;
  };
}

export interface CreateCommentDto {
  user_plant_id: string;
  text: string;
}

export interface UpdateCommentDto {
  text: string;
}

export const getCommentsByUserPlantId = async (userPlantId: string): Promise<Comment[]> => {
  try {
    const response = await Http.get(`/comments/user-plant/${userPlantId}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке комментариев:', error);
    throw error;
  }
};

export const getCommentById = async (commentId: string): Promise<Comment> => {
  try {
    const response = await Http.get(`/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке комментария:', error);
    throw error;
  }
};

export const createComment = async (dto: CreateCommentDto): Promise<Comment> => {
  try {
    const response = await Http.post('/comments', dto);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании комментария:', error);
    throw error;
  }
};

export const updateComment = async (commentId: string, dto: UpdateCommentDto): Promise<Comment> => {
  try {
    const response = await Http.put(`/comments/${commentId}`, dto);
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
