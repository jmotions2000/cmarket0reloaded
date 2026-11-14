"use server";

export async function uploadProduct(formData: FormData) {
  const data = {
    photo: formData.get("phoeo"),
    title: formData.get("title"),
    Price: formData.get("price"),
    description: formData.get("description"),
  };
  console.log(data);
}
