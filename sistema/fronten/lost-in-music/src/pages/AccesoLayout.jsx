import { Outlet } from 'react-router-dom';
import FondoAcceso from '../components/FondoAcceso';

export default function AccesoLayout() {
  return (
    <FondoAcceso>
      <Outlet />
    </FondoAcceso>
  );
}