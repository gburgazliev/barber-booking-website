import NewPassword from "../components/NewPassword";
import Header from "../components/Header";
const NewPasswordView = () => {
  return (
    <div className="  w-full flex flex-col  items-center gap-[100px] md:gap-[250px]">
        <Header/>
      <NewPassword />
    </div>
  );
};

export default NewPasswordView;
