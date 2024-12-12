import Header from "../components/Header";
import AuthPage from "../components/AuthPage";

const AuthView = () => {
  return (
    <div className=" w-full flex flex-col justify-items-center items-center gap-[250px] ">
      <Header />
      <AuthPage />
    </div>
  );
};

export default AuthView;
