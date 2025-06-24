import { createSlice } from '@reduxjs/toolkit';

const BASE_URL = 'https://aviasales-test-api.kata.academy';

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
      const newTickets = action.payload;
      const existingTickets = state.tickets;

      const uniqueTickets = newTickets.filter((newTicket) => {
        return !existingTickets.some((existingTicket) => {
          return (
            newTicket.price === existingTicket.price &&
            newTicket.carrier === existingTicket.carrier &&
            newTicket.segments[0].date === existingTicket.segments[0].date &&
            newTicket.segments[1].date === existingTicket.segments[1].date
          );
        });
      });

      state.tickets.push(...uniqueTickets);
      saveTicketsToStorage(state.tickets);
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
    const response = await fetch(`${BASE_URL}/search`);

    if (!response.ok) {

      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json(); 
    dispatch(setSearchId(data.searchId));
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
  
  let accumulatedTickets = [];
  const BATCH_SIZE = 300;

  while (!stop && errorCount < MAX_ERRORS) {
    try {
      const response = await fetch(`${BASE_URL}/tickets?searchId=${searchId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response status:', response.status);
        console.error('Server error response data (text):', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      
      if (data.tickets && data.tickets.length > 0) {
        accumulatedTickets.push(...data.tickets);
      }
      
      if (accumulatedTickets.length >= BATCH_SIZE || (data.stop && accumulatedTickets.length > 0)) {
        dispatch(addTickets(accumulatedTickets));
        accumulatedTickets = [];
      }
      
      stop = data.stop;
      errorCount = 0;

      if (!stop) {
        await new Promise((resolve) => setTimeout(resolve, SUCCESS_DELAY));
      }
    } catch (error) {
      if (!(error.message && error.message.startsWith('HTTP error!'))) {
         console.error('Error fetching tickets (non-HTTP or parse):', error);
      }
      errorCount++;
      if (errorCount >= MAX_ERRORS) {
        console.error(`Max errors (${MAX_ERRORS}) reached. Stopping fetch.`);
        break; 
      }
      await new Promise((resolve) => setTimeout(resolve, ERROR_RETRY_DELAY));
    }
  }
  if (accumulatedTickets.length > 0 && errorCount < MAX_ERRORS) {
     dispatch(addTickets(accumulatedTickets));
  }
  dispatch(setLoading(false));
};

export default apiSlice.reducer;