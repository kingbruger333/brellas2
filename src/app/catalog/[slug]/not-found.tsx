import Link from "next/link";
import { Container } from "@/components/container";

export default function ProductNotFound() {
  return (
    <main className="section">
      <Container>
        <div className="emptyState">
          <h1>Товар не найден</h1>
          <p>Возможно, позиция была снята с публикации или изменила адрес.</p>
          <Link href="/catalog" className="primaryButton">
            Вернуться в каталог
          </Link>
        </div>
      </Container>
    </main>
  );
}
