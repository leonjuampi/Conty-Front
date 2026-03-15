
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './router';
import { AuthProvider } from './context/AuthContext';
import { CashProvider } from './context/CashContext';

function App() {
  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <AuthProvider>
        <CashProvider>
          <AppRoutes />
        </CashProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
