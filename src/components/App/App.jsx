import { useEffect } from 'react';
import './App.scss';
import MyButton from '../MyButton/MyButton';
import TransferForm from '../TransferForm/TransferForm';
import Header from '../Header/Header';
import TicketsList from '../TicketsList/TicketsList';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSearchId, fetchTickets } from '../../store/apiSlice';
import { setSorter } from '../../store/ticketsSlice';
import clsx from 'clsx';

function App() {
  const dispatch = useDispatch();
  const { searchId, loading } = useSelector((state) => state.tickets);
  const selectedSorter = useSelector((state) => state.filter.selectedSorter);

  useEffect(() => {
    dispatch(fetchSearchId());
  }, [dispatch]);

  useEffect(() => {
    if (searchId) {
      dispatch(fetchTickets(searchId));
    }
  }, [searchId, dispatch]);

  const handleSort = (type) => {
    dispatch(setSorter(type));
  };

  return (
    <div>
      {loading && (
        <div className="progress-bar-container">
          <div className="progress-bar" />
        </div>
      )}
      <Header />
      <div className="box">
        <aside className="box__transfer-form">
          <TransferForm />
        </aside>
        <main className="box__main-content">
          <div className="sort-buttons-container">
            <MyButton
              text="Самый дешевый"
              className={clsx('sort-button', {
                'sort-button--active': selectedSorter === 'cheapest',
              })}
              onClick={() => handleSort('cheapest')}
            />
            <MyButton
              text="Самый быстрый"
              className={clsx('sort-button', {
                'sort-button--active': selectedSorter === 'fastest',
              })}
              onClick={() => handleSort('fastest')}
            />
            <MyButton
              text="Оптимальный"
              className={clsx('sort-button', {
                'sort-button--active': selectedSorter === 'optimal',
              })}
              onClick={() => handleSort('optimal')}
            />
          </div>
          <TicketsList />
        </main>
      </div>
    </div>
  );
}

export default App;