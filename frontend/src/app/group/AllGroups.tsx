"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { GroupType } from "@/context/groupStore";
import { BASE_URL } from "@/constant/constants";
import { UserType } from "@/context/authStore";

import EditIcon from "@/assets/pngs/edit.png";
import DeleteIcon from "@/assets/pngs/delete.png";
import Breadcrumbs from "@/components/BreadCrumbs";
import Image from "next/image";

const breadcrumbs = [
  { label: 'Home', href: '/home' },
  { label: 'Groups', href: '/group' }
];

const queryClient = new QueryClient();

export default function AllGroups() {
  return (
    <QueryClientProvider client={queryClient}>
      <AllGroupsContent />
    </QueryClientProvider>
  );
}

function AllGroupsContent() {
  const [user, setUser] = useState<UserType | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user-storage");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser.state.user);
    }
  }, []);

  const { data: groups, isPending, isError, refetch } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const response = await fetch(`${BASE_URL}/users/${user?.id}/groups`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          uid: user?.uid || "",
          client: user?.client || "",
          "access-token": user?.accessToken || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }

      const data = await response.json();
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await fetch(`${BASE_URL}/groups/${groupId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          uid: user?.uid || "",
          client: user?.client || "",
          "access-token": user?.accessToken || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete group");
      }

      return groupId;
    },
    onSuccess: (deletedGroupId) => {
      setIsModalOpen(false);
      refetch();
    },
    onError: (error) => {
      console.error("Failed to delete group:", error);
    },
  });

  const handleEditClick = (groupId: string) => {
    router.push(`/group/edit/${groupId}`);
  };

  const handleDeleteClick = (groupId: string) => {
    setGroupToDelete(groupId);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (groupToDelete) {
      deleteMutation.mutate(groupToDelete);
    }
  };

  const handleCancelDelete = () => {
    setIsModalOpen(false);
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[90vh] bg-[#fff0b5]">
        <div className="text-black text-lg font-semibold">Loading...</div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[90vh] bg-[#fff0b5]">
        <div className="text-black text-lg font-semibold">Error fetching groups. Please try again.</div>
      </div>
    );
  }
  

  return (
    <div className="p-4 text-primary">
      <h1 className="text-2xl font-bold mb-4">All Groups</h1>
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      {groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group: GroupType) => (
            <div
              key={group.id}
              className="card bg-card text-neutral-content w-full shadow-xl cursor-pointer transition-transform duration-200 ease-in-out transform hover:scale-[1.01] hover:shadow-md hover:shadow-primary/800"
              onClick={() => router.push(`/group/${group.id}`)}
            >
              <div className="card-body items-center text-primary text-center">
                <h2 className="card-title">{group.name}</h2>
                <p>Owner: {group.owner.name} (ID: {group.owner.id})</p>
                <div className="card-actions justify-center space-x-4 mt-4">
                  {
                    user?.name === group.owner.name && (
                      <button
                        className="flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(group.id);
                        }}
                      >
                        <Image
                          src={EditIcon}
                          alt="Edit"
                          width={20}
                        />
                      </button>
                    )
                  }
                  {group.owner.id === user?.id && (
                    <button
                    className="flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(group.id);
                    }}
                    disabled={deleteMutation.isPending}
                    >
                      <Image
                          src={DeleteIcon}
                          alt="Delete"
                          width={21}
                      />
                    </button>
                )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No groups available.</p>
      )}

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box bg-white">
            <h3 className="font-bold text-lg">Confirm Deletion</h3>
            <p>Are you sure you want to delete this group?</p>
            <div className="modal-action">
              <button className="btn btn-error text-white" onClick={handleConfirmDelete} disabled={deleteMutation.isPending}>
                Yes, delete it
              </button>
              <button className="btn" onClick={handleCancelDelete}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}