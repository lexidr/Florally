import { Http } from "../constants/api";

export const createEvent = async (eventData: {
  name: string;
  date: string;
  user_plant_id: string;
  color?: string;
  description?: string;
}) => {
  const response = await Http.post("/events", {
    name: eventData.name,
    date: new Date(eventData.date).toISOString(),
    user_plant_id: eventData.user_plant_id,
    color: eventData.color || "#A8C686",
    description: eventData.description || "",
    completed: false,
  });
  return response.data;
};

export const getEvents = async () => {
  const response = await Http.get("/events");
  return response.data;
};

export const deleteEvent = async (eventId: string) => {
  const response = await Http.delete(`/events/${eventId}`);
  return response.data;
};

export const updateEvent = async (eventId: string, eventData: any) => {
  const response = await Http.patch(`/events/${eventId}`, eventData);
  return response.data;
};