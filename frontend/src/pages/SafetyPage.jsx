import Breadcrumbs from "../components/Breadcrumbs.jsx";
import Footer from "../components/Footer.jsx";
import Header from "../features/nav/Header.jsx";
import {
  ImcroCard,
  ImcroContainer,
  ImcroPage,
  ImcroSection,
} from "../components/imcro/ImcroPublicComponents.jsx";

export default function SafetyPage({ currentUser, onGoAuth, onGoAdmin, onGoProfile }) {
  return (
    <ImcroPage className="safety-page">
      <Header
        currentUser={currentUser}
        onGoAuth={onGoAuth}
        onGoAdmin={onGoAdmin}
        onGoProfile={onGoProfile}
      />
      <main className="home-main">
        <ImcroContainer>
          <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Безопасность" }]} />
          <ImcroSection>
            <ImcroCard className="safety-page__card">
              <span className="safety-page__eyebrow">Информационная безопасность</span>
              <h1>Безопасность</h1>
              <p>Материалы раздела будут добавлены позже.</p>
            </ImcroCard>
          </ImcroSection>
        </ImcroContainer>
      </main>
      <Footer />
    </ImcroPage>
  );
}
