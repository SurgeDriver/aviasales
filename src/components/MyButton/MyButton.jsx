import {} from 'react';
import classes from './MyButton.module.scss';
import clsx from 'clsx';

const MyButton = ({ text, style, onClick, disabled, className }) => {
  const combinedClassName = clsx(classes.myButton, className);
  
  return (
    <button
      className={combinedClassName}
      style={style}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </button>
  );
};

export default MyButton;