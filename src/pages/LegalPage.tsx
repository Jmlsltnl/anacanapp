import { useParams, useNavigate } from 'react-router-dom';
import LegalScreen from '@/components/LegalScreen';

const LegalPage = () => {
  const { docType } = useParams<{ docType: string }>();
  const navigate = useNavigate();

  return (
    <div className="h-screen">
      <LegalScreen
        onBack={() => navigate('/')}
        initialDocument={docType}
      />
    </div>
  );
};

export default LegalPage;
