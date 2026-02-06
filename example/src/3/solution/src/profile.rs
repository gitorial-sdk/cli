#[derive(Debug)]
pub struct Profile {
    bio: String,
}

impl Profile {
    pub fn new(bio: impl Into<String>) -> Self {
        Self { bio: bio.into() }
    }
}
