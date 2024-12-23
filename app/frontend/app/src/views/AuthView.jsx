import Header from "../components/Header";
import AuthPage from "../components/AuthPage";

const AuthView = () => {
  return (
    <div className=" w-full flex flex-col  items-center gap-[100px] md:gap-[180px] ">
      <Header />
      <AuthPage />
    </div>
  );
};

export default AuthView;
