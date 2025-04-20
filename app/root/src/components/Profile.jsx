import AuthContext from "../context/AuthContext";
import { useContext } from "react";

const Profile = () => {
    const { isLoggedIn } = useContext(AuthContext);
    const { user } = isLoggedIn;
    const { firstname, lastname, email } = user;

    return (
        <div className="flex flex-col justify-items-center items-center w-full gap-[100px] bg-base-200 rounded-lg p-10">
            <div className="flex flex-col justify-items-center items-center w-full gap-[20px]">
                <h1 className="text-3xl font-bold">Profile</h1>
                <div className="flex flex-col justify-items-center items-center w-full gap-[20px]">
                    <div className="flex flex-col justify-items-center items-center w-full gap-[10px]">
                        <h2 className="text-2xl font-bold">User Information</h2>
                        <p className="text-lg">{firstname}</p>
                        <p className="text-lg">{lastname}</p>
                        <p className="text-lg">{email}</p>
                    </div>
                </div>
                <div className="flex flex-col justify-items-center items-center w-full gap-[20px]">
                    <h2 className="text-2xl font-bold">Booking History</h2>
                    <p className="text-lg">No bookings yet.</p>

            </div>
        </div>
        </div>
  

    );
    }
    export default Profile;