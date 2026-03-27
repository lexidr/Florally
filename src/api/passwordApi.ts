import { Http } from '../constants/api';

export interface ForgotPasswordDto {
  email: string;
}

export interface VerifyCodeDto {
  email: string;
  code: string;
}

export interface ResetPasswordDto {
  email: string;
  newPassword: string;
}

export interface IPasswordMessageResponse {
  message: string;
}

export interface IVerifyCodeResponse {
  verified: boolean;
  success: boolean;
  message: string;
}

export const forgotPassword = async (data: ForgotPasswordDto): Promise<IPasswordMessageResponse> => {
  try {
    const response = await Http.post('/auth/verification', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyResetCode = async (data: VerifyCodeDto): Promise<IVerifyCodeResponse> => {
  try {
    const response = await Http.post('/auth/verification/check', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (data: ResetPasswordDto): Promise<IPasswordMessageResponse> => {
  try {
    const response = await Http.put('/auth/recoverPassword', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};