import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios'; 

const api = axios.create({
  baseURL: 'https://aviasales-test-api.kata.academy',
  timeout: 5000,

});

const loadTicketsFromStorage = () => {
  const savedTickets = localStorage.getItem('tickets');
  return savedTickets ? JSON.parse(savedTickets) : [];
};

const saveTicketsToStorage = (tickets) => {
  localStorage.setItem('tickets', JSON.stringify(tickets));
};

const initialState = {
  tickets: loadTicketsFromStorage(),
  loading: false,
  searchId: null,
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

      const existingTicketIds = new Set(
        state.tickets.map(
          (t) => `${t.price}_${t.carrier}_${t.segments[0].date}_${t.segments[1].date}`
        )
      );

      const ticketsToAdd = [];
      for (const newTicket of newTicketsPayload) {
        const ticketId = `${newTicket.price}_${newTicket.carrier}_${newTicket.segments[0].date}_${newTicket.segments[1].date}`;
        if (!existingTicketIds.has(ticketId)) {
          ticketsToAdd.push(newTicket);
          existingTicketIds.add(ticketId); 
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
      localStorage.removeItem('tickets');
    },
  },
});

export const { addTickets, setSearchId, setLoading, clearTickets } =
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
        console.error('Error without response (e.g., network issue):', error.message);
      }

      errorCount++;
      if (errorCount >= MAX_ERRORS) {
        console.error(`Max errors (${MAX_ERRORS}) reached. Stopping fetch for this searchId.`);
        break; 
      }
      await new Promise((resolve) => setTimeout(resolve, ERROR_RETRY_DELAY));
    } 

  }
  dispatch(setLoading(false)); 
};

export default apiSlice.reducer;