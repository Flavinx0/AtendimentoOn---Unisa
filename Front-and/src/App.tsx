import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RotaPorPerfil, RotaProtegida, RotaPublica } from './auth/Rotas';
import { AppLayout } from './components/AppLayout';
import { AssistentePage } from './pages/AssistentePage';
import { CadastroPage } from './pages/CadastroPage';
import { EquipePage } from './pages/EquipePage';
import { EsqueciSenhaPage } from './pages/EsqueciSenhaPage';
import { ChamadoDetalhePage } from './pages/ChamadoDetalhePage';
import { ChamadosPage } from './pages/ChamadosPage';
import { InicioPage } from './pages/InicioPage';
import { LoginPage } from './pages/LoginPage';
import { NaoEncontradoPage } from './pages/NaoEncontradoPage';
import { NovoChamadoPage } from './pages/NovoChamadoPage';
import { TrocarSenhaPage } from './pages/TrocarSenhaPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RotaPublica />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<CadastroPage />} />
            <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
          </Route>

          <Route element={<RotaProtegida />}>
            {/* Fora do layout do app: no primeiro acesso, a troca de senha é a única tela liberada. */}
            <Route path="/trocar-senha" element={<TrocarSenhaPage />} />
            <Route element={<AppLayout />}>
              <Route index element={<InicioPage />} />
              <Route path="chamados" element={<ChamadosPage key="chamados" />} />
              <Route path="chamados/novo" element={<NovoChamadoPage />} />
              <Route path="chamados/:id" element={<ChamadoDetalhePage />} />
              <Route path="assistente" element={<AssistentePage />} />
              <Route element={<RotaPorPerfil perfis={['Administrador']} />}>
                <Route path="outras-equipes" element={<ChamadosPage key="outras-equipes" supervisao />} />
                <Route path="equipe" element={<EquipePage />} />
              </Route>
              <Route path="*" element={<NaoEncontradoPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
