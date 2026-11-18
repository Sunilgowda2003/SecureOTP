
import api from "../api";

// 1. Registration OTP request
export const requestRegistrationOtp = async (userData) => {
  const response = await api.post(
    "/auth/register/request-otp",
    userData
  );
  return response.data;
};

// 2. Registration OTP verification
export const verifyRegistrationOtp = async (email, code) => {
  const response = await api.post(
    "/auth/register/verify",
    { email, code }
  );
  return response.data;
};

// 3. Login OTP request
export const requestLoginOtp = async (email) => {
  const response = await api.post(
    "/auth/login/request-otp",
    { email }
  );
  return response.data;
};

// 4. Login OTP verification
export const verifyLoginOtp = async (email, code) => {
  const response = await api.post(
    "/auth/login/verify",
    { email, code }
  );
  return response.data;
};

// 5. Forgot password OTP request
export const requestPasswordResetOtp = async (email) => {
  const response = await api.post(
    "/auth/password/forgot",
    { email }
  );
  return response.data;
};

// 6. Reset password
export const resetPassword = async (
  email,
  code,
  newPassword
) => {
  const response = await api.post(
    "/auth/password/reset",
    { email, code, newPassword }
  );
  return response.data;
};

// 7. Get protected user profile
export const getUserProfile = async () => {
  const response = await api.get("/user/profile");
  return response.data;
};
