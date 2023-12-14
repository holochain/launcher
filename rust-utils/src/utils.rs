pub fn vec_to_arr<T, const N: usize>(v: Vec<T>) -> [T; N] {
  v.try_into()
      .unwrap_or_else(|v: Vec<T>| panic!("Expected a Vec of length {} but it was {}", N, v.len()))
}
