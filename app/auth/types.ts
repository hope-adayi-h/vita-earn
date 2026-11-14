export interface ActionResponse {
  success?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}
