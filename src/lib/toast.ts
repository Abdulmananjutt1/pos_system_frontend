/**
 * Central toast utility.
 * Maps raw backend messages to clean, user-friendly English messages.
 */

import toast from "react-hot-toast";

const MESSAGE_MAP: Record<string, string> = {
  // Medicine
  "Medicine name is required":               "Medicine name is required",
  "Selling price must be a valid number":    "Please enter a valid selling price",
  "Stock must be a valid number":            "Please enter a valid stock quantity",
  "Expiry date must be a valid date":        "Please enter a valid expiry date",
  "Medicine not found":                      "Medicine not found",
  "Medicine created":                        "Medicine added successfully",
  "Medicine updated":                        "Medicine updated successfully",
  "Medicine deleted":                        "Medicine deleted successfully",
  "Stock adjusted":                          "Stock updated successfully",

  // Auth
  "Invalid email or password":               "Invalid email or password",
  "Email already in use":                    "This email is already registered",
  "No token provided":                       "Please log in to continue",
  "Invalid or expired token":                "Your session has expired, please log in again",
  "Access denied: insufficient permissions": "You don't have permission to do this",
  "Login successful":                        "Welcome back!",

  // General
  "Validation failed":                       "Some fields are invalid, please check and try again",
  "Route not found":                         "Requested resource not found",
  "Too many requests":                       "Too many requests, please wait a moment and try again",
  "Too many auth attempts":                  "Too many login attempts, please try again in 15 minutes",
};

function mapMessage(raw: string): string {
  return MESSAGE_MAP[raw] ?? raw;
}

export function toastApiError(err: unknown): void {
  if (err instanceof Error) {
    toast.error(mapMessage(err.message));
    return;
  }
  toast.error("Something went wrong, please try again");
}

export function toastSuccess(rawMessage: string): void {
  toast.success(mapMessage(rawMessage));
}

export function toastError(rawMessage: string): void {
  toast.error(mapMessage(rawMessage));
}

export { toast };
