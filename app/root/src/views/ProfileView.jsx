import Header from "../components/Header";
import Profile from "../components/Profile";


const ProfileView = () => {
    return (
        <div className=" flex  flex-col justify-items-center items-center w-full gap-[100px]">
            <Header />
            <Profile />
        </div>
    );
    }
    export default ProfileView;