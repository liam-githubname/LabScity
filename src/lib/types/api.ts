
// both data and error are optional since a success response won't have an error and a failure response doesn't have data
export interface ApiResponse<T> {
    success: boolean;
    data?: T; // this is a generic type that gets filled in when you use it
    error?: string;
}
