#[derive(Debug)]
struct User {
    name: String,
    age: u8,
}

impl User {
    fn new(name: impl Into<String>, age: u8) -> Self {
        Self {
            name: name.into(),
            age,
        }
    }

    fn summary(&self) -> String {
        format!("{} ({} years old)", self.name, self.age)
    }
}

fn main() {
    let user = User::new("Taylor", 29);
    println!("{}", user.summary());
}
