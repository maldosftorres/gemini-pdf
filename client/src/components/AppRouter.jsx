import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Header } from './Header';
import { UploadPDF } from './UploadPDF';
import { ListFiles } from './ListFiles';
import { Home } from './Home';
import { ConsultMongo } from './ConsultMongo';

export const AppRouter = () => {
    return (
        <Router>
            <Header />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/upload" element={<UploadPDF />} />
                <Route path="/listar-archivos" element={<ListFiles />} />
                <Route path="/consultar-archivos" element={<ConsultMongo />} />
            </Routes>
        </Router>
    );
}
