import { useAuth } from "../context/AuthContext";
import apiClient from "../api/apiClient.jsx";
import LeaderboardTable from "../components/LeaderboardTable.jsx";


export default function Friends() {

    const { user } = useAuth();
    
    const {userFriends, setFriends} = useState();

    const getUserFriends = async () => {
        try {
            const response = await apiClient.get(`/api/friends/`);
            if (!response.ok) throw new Error('Failed to fetch friends');
            const data = await response.json();
            setFriends(data.friends);
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    useEffect(() => {
        if (user) {
            getUserFriends();
        }
    }, [user]);


    return (
    <>
    <Navbar />
    <div className="friends-container">
        <LeaderboardTable friends={userFriends} />
    </div>
    </>
    );

}