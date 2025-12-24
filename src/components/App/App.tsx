import { useDebounce } from "use-debounce";
import Loader from "../Loader/Loader";
import SearchBox from "../SearchBox/SearchBox";
import toast, { Toaster } from "react-hot-toast";
import NoteList from "../NoteList/NoteList";
import Pagination from "../Pagination/Pagination";
import Modal from "../Modal/Modal";
import NoteForm from "../NoteForm/NoteForm";
import { fetchNotes, createNote, deleteNote } from "../../services/noteService";
import type { FetchNotesResponse } from "../../services/noteService";
import css from "./App.module.css";
import type { Note } from "../../types/note";
import { useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

export default function App() {
  const [page, setPage] = useState(1);
  const perPage = 12;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [debouncedSearch] = useDebounce(search, 300);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const queryClient = useQueryClient();

  const { data, isLoading, isError, isSuccess } = useQuery<
    FetchNotesResponse,
    Error
  >({
    queryKey: ["notes", page, debouncedSearch],
    queryFn: () => fetchNotes({ page, perPage, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  });

  const mutation = useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setIsModalOpen(false);
      toast.success("Note created successfully!");
    },
    onError: () => {
      toast.error("Failed to create note. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete note.");
    },
  });

  const handleDeleteNote = (id: string) => {
    deleteMutation.mutate(id);
  };

  const notes = data?.notes || [];
  const totalPages = data?.totalPages || 0;

  useEffect(() => {
    if (isSuccess && notes.length === 0) {
      toast.error("No notes found.");
    }
  }, [isSuccess, notes.length]);

  const handleCreateNote = (values: {
    title: string;
    content: string;
    tag: string;
  }) => {
    mutation.mutate(values as Omit<Note, "id">);
  };

  return (
    <div className={css.app}>
      <header className={css.toolbar}>
        <SearchBox value={search} onChange={handleSearchChange} />
        <button className={css.button} onClick={() => setIsModalOpen(true)}>
          Create note +
        </button>
      </header>

      <main>
        {isLoading && <Loader />}
        {/* {isLoading && <p className={css.message}>Loading notes...</p>} */}
        {isError && (
          <p className={css.message}>Error loading notes. Check your token.</p>
        )}
        {<NoteList notes={notes} onDelete={handleDeleteNote} />}

        {totalPages > 1 && (
          <Pagination
            pageCount={totalPages}
            onPageChange={(selectedItem) => setPage(selectedItem.selected + 1)}
          />
        )}
      </main>

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <NoteForm
            onSubmit={handleCreateNote}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      )}

      <Toaster position="top-right" />
    </div>
  );
}
