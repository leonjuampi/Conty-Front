
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './router';
import { AuthProvider } from './context/AuthContext';
import { CashProvider } from './context/CashContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationModal } from './components/feature/NotificationModal';

function App() {
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <AuthProvider>
        <ThemeProvider>
          <CashProvider>
            <NotificationProvider>
              <NotificationModal />
              <AppRoutes />
            </NotificationProvider>
          </CashProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
