import LeaderboardRow from "./LeaderboardRow";

export default function LeaderboardTable({ friends }) {

    return (
        
        <div className="leaderboard-table">
            <ul>
                <li>
                    {friends.map((friend) => (
                        <LeaderboardRow user={friend} />
                    ))}
                </li>
            </ul>
        </div>

    );

}