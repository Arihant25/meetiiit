import { UserModel } from "@/lib/models/User";
import { deleteRoomsForUser } from "@/lib/chat";

export async function deleteUserAndData(userId: string) {
    await deleteRoomsForUser(userId);
    await UserModel.findByIdAndDelete(userId);
}
