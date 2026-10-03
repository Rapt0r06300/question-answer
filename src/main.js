export async function bootstrap() {
  return { name: 'Question Answer', version: '0.1.0' };
}

if (typeof window !== 'undefined') {
  void bootstrap();
}
