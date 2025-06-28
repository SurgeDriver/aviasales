import React from 'react';
import './TicketsList.scss';
import Ticket from '../Ticket/Ticket';
import MyButton from '../MyButton/MyButton';
import { useSelector, useDispatch } from 'react-redux';
import { selectSortedTickets } from '../../store/ticketsSlice';
import { showMoreTickets } from '../../store/ticketsSlice';
import noTicketsImg from '../../assets/noTickets.png';

const TicketsList = () => {
  const dispatch = useDispatch();
  const sortedTickets = useSelector(selectSortedTickets);
  const { visibleTickets } = useSelector((state) => state.filter);
  const { loading, isStop } = useSelector((state) => state.tickets);

  const handleShowMore = () => {
    dispatch(showMoreTickets());
  };

  if (!loading && sortedTickets.length === 0) {
    return (
      <div className="no-tickets">
        <img
          className="no-tickets__img"
          src={noTicketsImg}
          alt="No tickets"
        />
        <div className="no-tickets__text">
          Рейсов, подходящих под заданные фильтры, не найдено
        </div>
      </div>
    );
  }

  return (
    <div>
      {sortedTickets.slice(0, visibleTickets).map((ticket) => {
        return (
          <Ticket
            key={ticket.id}
            price={ticket.price}
            carrier={ticket.carrier}
            outboundTicket={ticket.segments[0]}
            returnTicket={ticket.segments[1]}
          />
        );
      })}
      {visibleTickets < sortedTickets.length && (
        <MyButton
          className="show-more-button"
          text={loading && !isStop ? 'Загрузка...' : 'Показать еще 5 билетов'}
          onClick={handleShowMore}
          disabled={loading && !isStop}
        />
      )}
    </div>
  );
};

export default TicketsList;