import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://aviasales-test-api.kata.academy',
  timeout: 5000,
});

const loadTicketsFromStorage = () => {
  try {
    const savedTickets = localStorage.getItem('tickets');
    return savedTickets ? JSON.parse(savedTickets) : [];
  } catch (e) {
    console.error('Failed to load tickets from localStorage', e);
    return [];
  }
};

const saveTicketsToStorage = (tickets) => {
  try {
    localStorage.setItem('tickets', JSON.stringify(tickets));
  } catch (e) {
    console.error('Failed to save tickets to localStorage', e);
  }
};

const initialState = {
  tickets: loadTicketsFromStorage(),
  loading: false,
  searchId: null,
  isStop: false, // New state to track when polling should stop
};

const apiSlice = createSlice({
  name: 'api',
  initialState,
  reducers: {
    addTickets: (state, action) => {
      const newTicketsPayload = action.payload;
      if (!newTicketsPayload || newTicketsPayload.length === 0) {
        return;
      }

      const existingTicketIds = new Set(state.tickets.map((t) => t.id));

      const ticketsToAdd = [];
      for (const newTicket of newTicketsPayload) {
        // Generate a stable and unique ID from the ticket's core properties.
        const ticketId = `${newTicket.price}-${newTicket.carrier}-${newTicket.segments[0].date}-${newTicket.segments[1].date}-${newTicket.segments[0].duration}-${newTicket.segments[1].duration}`;

        if (!existingTicketIds.has(ticketId)) {
          // Add the ticket with its new ID.
          ticketsToAdd.push({ ...newTicket, id: ticketId });
          existingTicketIds.add(ticketId); // also add to the set to handle duplicates within the same payload
        }
      }

      if (ticketsToAdd.length > 0) {
        state.tickets.push(...ticketsToAdd);
        saveTicketsToStorage(state.tickets);
      }
    },

    setSearchId: (state, action) => {
      state.searchId = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearTickets: (state) => {
      state.tickets = [];
      state.isStop = false; // Reset the stop flag on a new search
      localStorage.removeItem('tickets');
    },
    setStop: (state, action) => {
      state.isStop = action.payload;
    },
  },
});

export const { addTickets, setSearchId, setLoading, clearTickets, setStop } =
  apiSlice.actions;

export const fetchSearchId = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const response = await api.get('/search');
    dispatch(setSearchId(response.data.searchId));
    dispatch(clearTickets());
  } catch (error) {
    console.error('Error fetching searchId:', error);
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchTickets = (searchId) => async (dispatch) => {
  dispatch(setLoading(true));
  let stop = false;
  let errorCount = 0;
  const MAX_ERRORS = 5;
  const SUCCESS_DELAY = 250;
  const ERROR_RETRY_DELAY = 1000;

  while (!stop && errorCount < MAX_ERRORS) {
    try {
      const response = await api.get(`/tickets?searchId=${searchId}`);

      if (response.data && response.data.tickets) {
        dispatch(addTickets(response.data.tickets));
      }

      stop = response.data.stop;
      if (stop) {
        dispatch(setStop(true));
      }

      errorCount = 0;

      if (!stop) {
        await new Promise((resolve) => setTimeout(resolve, SUCCESS_DELAY));
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      if (error.response) {
        console.error('Server error response status:', error.response.status);

        console.error('Server error response data:', error.response.data);
      } else {
        console.error(
          'Error without response (e.g., network issue):',
          error.message
        );
      }

      errorCount++;
      if (errorCount >= MAX_ERRORS) {
        console.error(
          `Max errors (${MAX_ERRORS}) reached. Stopping fetch for this searchId.`
        );
        dispatch(setStop(true)); // Stop polling on our end
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, ERROR_RETRY_DELAY));
    }
  }
  dispatch(setLoading(false));
};

export default apiSlice.reducer;