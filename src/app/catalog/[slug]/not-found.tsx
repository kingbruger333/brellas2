import Link from "next/link";
import { Container } from "@/components/container";

export default function ProductNotFound() {
  return (
    <main className="section">
      <Container>
        <div className="emptyState">
          <p>Товар не найден.</p>
          <Link href="/catalog" className="primaryButton">
            Вернуться в каталог
          </Link>
        </div>
      </Container>
    </main>
  );
}
