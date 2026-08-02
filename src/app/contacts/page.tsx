import { SidebarLayout } from "@/components/sidebar-layout";
import { ContactsList } from "@/components/contacts-list";

export default function ContactsPage() {
  return (
    <SidebarLayout>
      <ContactsList />
    </SidebarLayout>
  );
}
